import pytest
from marketplace_common.testing import TEST_PUBLIC_KEY_PEM, bearer, make_access_token
from rest_framework.test import APIClient

from carts.tests.fakes import FakeProductCatalog


@pytest.fixture(autouse=True)
def catalog(settings):
    settings.PRODUCT_CATALOG_CLASS = "carts.tests.fakes.FakeProductCatalog"
    FakeProductCatalog.reset()
    return FakeProductCatalog


@pytest.fixture(autouse=True)
def trust_test_tokens(settings):
    settings.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM


@pytest.fixture
def make_client():
    def _make(role="user"):
        client = APIClient()
        client.credentials(**bearer(make_access_token(role=role)))
        return client

    return _make


@pytest.fixture
def api_client(make_client):
    """A logged-in regular user (each call to make_client is a different user)."""
    return make_client()
