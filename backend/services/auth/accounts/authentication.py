from marketplace_common.auth import JWTAuthentication

from . import keys


class LocalJWTAuthentication(JWTAuthentication):
    """Same verification as every other service, but with the local public key:
    fetching our own JWKS over HTTP from inside a request would be pointless (and
    could deadlock a single sync worker)."""

    def get_verifying_key(self, token):
        return keys.public_key()
