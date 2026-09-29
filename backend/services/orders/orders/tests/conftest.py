import uuid

import pytest
from marketplace_common.testing import TEST_PUBLIC_KEY_PEM, bearer, make_access_token
from rest_framework.test import APIClient

from orders.tests.fakes import FakeCartGateway, FakeStockGateway


@pytest.fixture(autouse=True)
def cart(settings):
    settings.CART_GATEWAY_CLASS = "orders.tests.fakes.FakeCartGateway"
    FakeCartGateway.reset()
    return FakeCartGateway


@pytest.fixture(autouse=True)
def stock(settings):
    settings.STOCK_GATEWAY_CLASS = "orders.tests.fakes.FakeStockGateway"
    FakeStockGateway.reset()
    return FakeStockGateway


@pytest.fixture(autouse=True)
def trust_test_tokens(settings):
    settings.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM


@pytest.fixture
def make_client():
    """Each call is a different logged-in user; `client.user_id` tells which."""

    def _make(role="user", email=None):
        user_id = uuid.uuid4()
        client = APIClient()
        email = email or f"{role}@example.com"
        client.credentials(**bearer(make_access_token(user_id=user_id, role=role, email=email)))
        client.user_id = user_id
        return client

    return _make


@pytest.fixture
def user_client(make_client):
    return make_client()
