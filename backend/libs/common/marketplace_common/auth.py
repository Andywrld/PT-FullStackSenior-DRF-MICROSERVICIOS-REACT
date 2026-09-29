from dataclasses import dataclass
from uuid import UUID

import jwt
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from .errors import ServiceUnavailableError

ROLE_USER = "user"
ROLE_ADMIN = "admin"
ROLE_SUPER_ADMIN = "super_admin"
ROLES = (ROLE_USER, ROLE_ADMIN, ROLE_SUPER_ADMIN)
ADMIN_ROLES = frozenset({ROLE_ADMIN, ROLE_SUPER_ADMIN})

ALGORITHM = "RS256"
ACCESS_TOKEN_TYPE = "access"
DEFAULT_ISSUER = "marketplace-auth"
DEFAULT_AUDIENCE = "marketplace"


@dataclass(frozen=True)
class TokenUser:

    id: UUID
    role: str
    email: str = ""

    is_authenticated = True
    is_anonymous = False

    @property
    def is_admin(self):
        return self.role in ADMIN_ROLES

    @property
    def is_super_admin(self):
        return self.role == ROLE_SUPER_ADMIN


def jwt_issuer():
    return getattr(settings, "JWT_ISSUER", DEFAULT_ISSUER)


def jwt_audience():
    return getattr(settings, "JWT_AUDIENCE", DEFAULT_AUDIENCE)


_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        # Caches the key set; an unknown `kid` triggers a refetch (key rotation).
        _jwks_client = jwt.PyJWKClient(settings.JWT_JWKS_URL, cache_keys=True, lifespan=300, timeout=3)
    return _jwks_client


def _invalid_token(message="Invalid token."):
    return exceptions.AuthenticationFailed(message, code="invalid_token")


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != b"bearer":
            return None
        if len(parts) != 2:
            raise _invalid_token("Invalid Authorization header.")
        token = parts[1].decode()
        claims = self.decode(token)
        try:
            user = TokenUser(id=UUID(claims["sub"]), role=claims["role"], email=claims.get("email", ""))
        except (KeyError, ValueError) as exc:
            raise _invalid_token() from exc
        if user.role not in ROLES:
            raise _invalid_token()
        return user, token

    def authenticate_header(self, request):
        # Makes DRF answer 401 (not 403) when credentials are missing.
        return 'Bearer realm="api"'

    def get_verifying_key(self, token):
        public_key = getattr(settings, "JWT_PUBLIC_KEY", "")
        if public_key:
            return public_key
        try:
            return _get_jwks_client().get_signing_key_from_jwt(token).key
        except jwt.PyJWKClientConnectionError as exc:
            raise ServiceUnavailableError("The authentication service is temporarily unavailable.") from exc
        except jwt.PyJWKClientError as exc:
            raise _invalid_token() from exc

    def decode(self, token):
        try:
            claims = jwt.decode(
                token,
                self.get_verifying_key(token),
                algorithms=[ALGORITHM],
                audience=jwt_audience(),
                issuer=jwt_issuer(),
                options={"require": ["exp", "iat", "sub", "iss", "aud"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Token has expired.", code="token_expired") from exc
        except jwt.InvalidTokenError as exc:
            raise _invalid_token() from exc
        # A refresh token must never be accepted as an access token.
        if claims.get("type") != ACCESS_TOKEN_TYPE:
            raise _invalid_token()
        return claims
