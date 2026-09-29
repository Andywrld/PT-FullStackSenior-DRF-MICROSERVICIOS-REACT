import hashlib
from functools import lru_cache
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from jwt.algorithms import RSAAlgorithm


def generate_private_key_file(path):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(pem)
    path.chmod(0o600)


@lru_cache(maxsize=4)
def _load_private_key(path):
    return serialization.load_pem_private_key(Path(path).read_bytes(), password=None)


def private_key():
    return _load_private_key(settings.JWT_PRIVATE_KEY_PATH)


def public_key():
    return private_key().public_key()


def key_id():
    der = public_key().public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return hashlib.sha256(der).hexdigest()[:16]


def jwks():
    jwk = RSAAlgorithm.to_jwk(public_key(), as_dict=True)
    return {"keys": [{**jwk, "kid": key_id(), "use": "sig", "alg": "RS256"}]}
