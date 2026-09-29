import uuid
from decimal import Decimal

import pytest
from marketplace_common.testing import TEST_PUBLIC_KEY_PEM, bearer, make_access_token
from rest_framework.test import APIClient

from products.models import Product


@pytest.fixture(autouse=True)
def in_memory_media_storage(settings):
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    }


@pytest.fixture(autouse=True)
def in_memory_cache(settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    from django.core.cache import cache

    cache.clear()


@pytest.fixture(autouse=True)
def trust_test_tokens(settings):
    settings.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM


def _client(role=None):
    client = APIClient()
    if role:
        client.credentials(**bearer(make_access_token(role=role)))
    return client


@pytest.fixture
def api_client():
    """Anonymous caller."""
    return _client()


@pytest.fixture
def user_client():
    return _client("user")


@pytest.fixture
def admin_client():
    return _client("admin")


@pytest.fixture
def product_factory(db):
    def _create(**overrides):
        defaults = {
            "sku": f"SKU-{uuid.uuid4().hex[:8].upper()}",
            "name": "Test Product",
            "description": "",
            "price": Decimal("9.99"),
            "stock": 10,
            "is_active": True,
        }
        defaults.update(overrides)
        return Product.objects.create(**defaults)

    return _create
