import uuid
from datetime import timedelta

import jwt
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from marketplace_common.auth import ACCESS_TOKEN_TYPE, ALGORITHM
from marketplace_common.errors import DomainError

from . import keys
from .models import RefreshToken

REFRESH_TOKEN_TYPE = "refresh"


class InvalidRefreshTokenError(DomainError):
    status_code = 401
    code = "invalid_refresh_token"
    default_message = "Invalid or expired refresh token."


def issue_token_pair(user):
    now = timezone.now()
    access_ttl = timedelta(minutes=settings.JWT_ACCESS_TTL_MINUTES)
    refresh_ttl = timedelta(days=settings.JWT_REFRESH_TTL_DAYS)
    refresh_jti = uuid.uuid4()
    RefreshToken.objects.create(jti=refresh_jti, user=user, expires_at=now + refresh_ttl)

    access = _encode(
        {
            "sub": str(user.id),
            "role": user.role,
            "email": user.email,
            "type": ACCESS_TOKEN_TYPE,
            "jti": uuid.uuid4().hex,
        },
        now,
        access_ttl,
    )
    refresh = _encode(
        {"sub": str(user.id), "type": REFRESH_TOKEN_TYPE, "jti": refresh_jti.hex},
        now,
        refresh_ttl,
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "Bearer",
        "expires_in": int(access_ttl.total_seconds()),
    }


def rotate_refresh_token(raw_token):
    """A revoked token presented again was probably stolen: revoke all the user's refresh tokens."""
    jti = _decode_refresh(raw_token)["jti"]
    with transaction.atomic():
        token = (
            RefreshToken.objects.select_for_update()
            .select_related("user")
            .filter(jti=uuid.UUID(jti))
            .first()
        )
        reused = token is not None and token.revoked_at is not None
        if token and not reused and token.expires_at > timezone.now() and token.user.is_active:
            token.revoked_at = timezone.now()
            token.save(update_fields=["revoked_at"])
            return token.user, issue_token_pair(token.user)
    # Outside the transaction on purpose: the revocation must commit even though
    # the request fails.
    if reused:
        revoke_all_refresh_tokens(token.user)
    raise InvalidRefreshTokenError()


def revoke_all_refresh_tokens(user):
    RefreshToken.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())


def revoke_refresh_token(raw_token):
    try:
        jti = _decode_refresh(raw_token)["jti"]
    except InvalidRefreshTokenError:
        return
    RefreshToken.objects.filter(jti=uuid.UUID(jti), revoked_at__isnull=True).update(
        revoked_at=timezone.now()
    )


def _encode(claims, now, ttl):
    payload = {
        **claims,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    return jwt.encode(payload, keys.private_key(), algorithm=ALGORITHM, headers={"kid": keys.key_id()})


def _decode_refresh(raw_token):
    try:
        claims = jwt.decode(
            raw_token,
            keys.public_key(),
            algorithms=[ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={"require": ["exp", "sub", "jti"]},
        )
    except jwt.InvalidTokenError as exc:
        raise InvalidRefreshTokenError() from exc
    if claims.get("type") != REFRESH_TOKEN_TYPE:
        raise InvalidRefreshTokenError()
    return claims
