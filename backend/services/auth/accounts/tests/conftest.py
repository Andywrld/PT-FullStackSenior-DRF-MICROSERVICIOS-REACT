import uuid

import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from accounts.models import User

PASSWORD = "Str0ng-passphrase!"


@pytest.fixture(autouse=True)
def signing_key(settings, tmp_path):
    settings.JWT_PRIVATE_KEY_PATH = str(tmp_path / "jwt_private.pem")
    call_command("ensure_signing_key", verbosity=0)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_factory(db):
    def _create(role=User.Role.USER, email=None, password=PASSWORD):
        return User.objects.create_user(email or f"{uuid.uuid4().hex[:8]}@example.com", password, role=role)

    return _create


@pytest.fixture
def login(api_client):
    def _login(user_or_email, password=PASSWORD):
        email = getattr(user_or_email, "email", user_or_email)
        return api_client.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")

    return _login


@pytest.fixture
def client_for(login):
    """An APIClient authenticated as the given user (real login, real token)."""

    def _client(user):
        token = login(user).json()["data"]["access_token"]
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client

    return _client
