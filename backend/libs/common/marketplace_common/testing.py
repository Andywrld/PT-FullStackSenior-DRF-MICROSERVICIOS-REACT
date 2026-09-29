import time
import uuid

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from .auth import ACCESS_TOKEN_TYPE, ALGORITHM, DEFAULT_AUDIENCE, DEFAULT_ISSUER, ROLE_USER

_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

TEST_PUBLIC_KEY_PEM = (
    _private_key.public_key()
    .public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    .decode()
)


def make_access_token(user_id=None, role=ROLE_USER, email="user@example.com", expires_in=300):
    now = int(time.time())
    claims = {
        "sub": str(user_id or uuid.uuid4()),
        "role": role,
        "email": email,
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + expires_in,
        "iss": DEFAULT_ISSUER,
        "aud": DEFAULT_AUDIENCE,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(claims, _private_key, algorithm=ALGORITHM, headers={"kid": "test"})


def bearer(token):
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}
