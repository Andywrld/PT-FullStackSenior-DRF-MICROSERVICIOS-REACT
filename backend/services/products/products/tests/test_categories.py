import uuid

import pytest
from rest_framework import status

from products.models import Category

pytestmark = pytest.mark.django_db

CATEGORIES_URL = "/api/v1/categories/"
PRODUCTS_URL = "/api/v1/products/"


def category_url(category_id):
    return f"{CATEGORIES_URL}{category_id}/"


@pytest.fixture
def category_factory(db):
    def _create(name="Electronics", **overrides):
        return Category.objects.create(name=name, slug=name.lower().replace(" ", "-"), **overrides)

    return _create


def test_admin_creates_category_with_generated_slug(admin_client):
    response = admin_client.post(CATEGORIES_URL, {"name": "Home & Kitchen"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()["data"]
    assert (data["name"], data["slug"], data["product_count"]) == ("Home & Kitchen", "home-kitchen", 0)


def test_anyone_lists_categories_with_product_count_but_only_admins_write(
    api_client, user_client, category_factory, product_factory
):
    electronics = category_factory(name="Electronics")
    product_factory(category=electronics)
    product_factory(category=electronics)

    body = api_client.get(CATEGORIES_URL).json()

    assert [(c["name"], c["product_count"]) for c in body["data"]] == [("Electronics", 2)]
    assert body["meta"]["pagination"]["total_items"] == 1
    assert user_client.post(CATEGORIES_URL, {"name": "Toys"}, format="json").status_code == 403


def test_category_in_use_cannot_be_deleted(admin_client, category_factory, product_factory):
    used = category_factory(name="Electronics")
    product_factory(category=used)
    empty = category_factory(name="Garden")

    response = admin_client.delete(category_url(used.id))

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["error"]["code"] == "category_in_use"
    assert admin_client.delete(category_url(empty.id)).status_code == status.HTTP_200_OK


@pytest.mark.parametrize("state", ["unknown", "inactive"])
def test_product_cannot_use_unknown_or_inactive_category(admin_client, category_factory, state):
    category_id = uuid.uuid4() if state == "unknown" else category_factory(is_active=False).id
    payload = {"sku": "CAT-2", "name": "Mouse", "price": "10.00", "category_id": str(category_id)}

    response = admin_client.post(PRODUCTS_URL, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "category_id" in response.json()["error"]["details"]


def test_products_can_be_filtered_by_category(api_client, category_factory, product_factory):
    electronics = category_factory(name="Electronics")
    home = category_factory(name="Home")
    mouse = product_factory(category=electronics)
    product_factory(category=home)

    body = api_client.get(PRODUCTS_URL, {"category": str(electronics.id)}).json()

    assert [p["id"] for p in body["data"]] == [str(mouse.id)]


def test_sku_is_generated_from_the_category_when_not_sent(admin_client, category_factory, product_factory):
    category = category_factory(name="Electro Hogar")
    product_factory(sku="ELEC-0007", category=category)

    def create_sku(**extra):
        payload = {"name": "Horno", "price": "10.00", "stock": 1, **extra}
        return admin_client.post(PRODUCTS_URL, payload, format="json").json()["data"]["sku"]

    assert create_sku(category_id=str(category.id)) == "ELEC-0008"
    assert create_sku() == "PROD-0001"
