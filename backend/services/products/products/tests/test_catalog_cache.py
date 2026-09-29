from decimal import Decimal

import pytest
from rest_framework import status

from products.models import Category

pytestmark = pytest.mark.django_db

PRODUCTS_URL = "/api/v1/products/"


def test_repeated_catalog_reads_are_served_from_cache(api_client, product_factory):
    product_factory()

    first = api_client.get(PRODUCTS_URL)
    second = api_client.get(PRODUCTS_URL)

    assert (first["X-Cache"], second["X-Cache"]) == ("MISS", "HIT")
    assert second.json()["data"] == first.json()["data"]
    assert second.json()["meta"]["pagination"] == first.json()["meta"]["pagination"]
    assert second.json()["meta"]["request_id"] != first.json()["meta"]["request_id"]


@pytest.mark.parametrize("change", ["product_price", "category_rename", "product_delete"])
def test_any_catalog_change_invalidates_the_cache(
    admin_client, api_client, product_factory, django_capture_on_commit_callbacks, change
):
    category = Category.objects.create(name="Electronics", slug="electronics")
    product = product_factory(price=Decimal("10.00"), category=category)
    api_client.get(PRODUCTS_URL)  # warm the cache

    with django_capture_on_commit_callbacks(execute=True):
        if change == "product_price":
            admin_client.patch(f"{PRODUCTS_URL}{product.id}/", {"price": "12.50"}, format="json")
        elif change == "category_rename":
            admin_client.patch(f"/api/v1/categories/{category.id}/", {"name": "Gadgets"}, format="json")
        else:
            admin_client.delete(f"{PRODUCTS_URL}{product.id}/")

    response = api_client.get(PRODUCTS_URL)

    assert response["X-Cache"] == "MISS"
    data = response.json()["data"]
    expected = {
        "product_price": lambda: data[0]["price"] == "12.50",
        "category_rename": lambda: data[0]["category"]["name"] == "Gadgets",
        "product_delete": lambda: data == [],
    }
    assert expected[change]()


def test_pricing_lookup_by_ids_always_bypasses_the_cache(api_client, product_factory):
    product = product_factory()

    first = api_client.get(PRODUCTS_URL, {"ids": str(product.id)})
    second = api_client.get(PRODUCTS_URL, {"ids": str(product.id)})

    assert (first["X-Cache"], second["X-Cache"]) == ("BYPASS", "BYPASS")


def test_catalog_keeps_working_when_redis_is_down(api_client, product_factory, settings):
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": "redis://127.0.0.1:1/0",  # nothing listens here
            "OPTIONS": {"socket_connect_timeout": 0.2, "socket_timeout": 0.2},
        }
    }
    product_factory()

    response = api_client.get(PRODUCTS_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response["X-Cache"] == "MISS"
    assert len(response.json()["data"]) == 1
