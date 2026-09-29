import uuid
from types import SimpleNamespace

import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db

CART_URL = "/api/v1/cart/"
ITEMS_URL = "/api/v1/cart/items/"


def item_url(product_id):
    return f"{ITEMS_URL}{product_id}/"


@pytest.fixture
def add(api_client):
    def _add(product, quantity=1, client=None):
        payload = {"product_id": str(product.id), "quantity": quantity}
        return (client or api_client).post(ITEMS_URL, payload, format="json")

    return _add


def cart_data(response):
    return response.json()["data"]


def lines_by_product(response):
    return {line["product_id"]: line for line in cart_data(response)["items"]}


def test_each_user_only_sees_their_own_cart(make_client, catalog, add):
    alice, bob = make_client(), make_client()
    add(catalog.add(), client=alice)

    assert len(cart_data(alice.get(CART_URL))["items"]) == 1
    assert cart_data(bob.get(CART_URL))["items"] == []


def test_cart_uses_live_prices_and_computes_subtotals(api_client, catalog, add):
    mouse = catalog.add(name="Mouse", price="19.99")
    keyboard = catalog.add(name="Keyboard", price="89.90")
    add(mouse, quantity=2)
    add(keyboard)

    response = api_client.get(CART_URL)

    line = lines_by_product(response)[str(mouse.id)]
    assert (line["name"], line["unit_price"], line["line_total"]) == ("Mouse", "19.99", "39.98")
    assert cart_data(response)["subtotal"] == "129.88"
    assert cart_data(response)["total_quantity"] == 3


def test_adding_same_product_twice_increments_quantity(catalog, add):
    mouse = catalog.add()
    add(mouse, quantity=1)

    response = add(mouse, quantity=2)

    assert [line["quantity"] for line in cart_data(response)["items"]] == [3]


@pytest.mark.parametrize("state", ["unknown", "inactive"])
def test_adding_unavailable_product_returns_400(catalog, add, state):
    product = catalog.add(is_active=False) if state == "inactive" else SimpleNamespace(id=uuid.uuid4())

    response = add(product)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    error = response.json()["error"]
    assert error["code"] == "product_not_available"
    assert "product_id" in error["details"]


def test_quantity_cannot_exceed_stock_when_adding_or_updating(api_client, catalog, add):
    mouse = catalog.add(stock=3)
    assert add(mouse, quantity=2).status_code == status.HTTP_200_OK

    assert add(mouse, quantity=2).status_code == status.HTTP_400_BAD_REQUEST  # 2 + 2 > 3
    response = api_client.patch(item_url(mouse.id), {"quantity": 4}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["error"]["code"] == "insufficient_stock"


def test_update_quantity_and_remove_item(api_client, catalog, add):
    mouse = catalog.add(price="10.00")
    keyboard = catalog.add(price="5.00")
    add(mouse)
    add(keyboard)

    response = api_client.patch(item_url(mouse.id), {"quantity": 4}, format="json")
    assert cart_data(response)["subtotal"] == "45.00"

    response = api_client.delete(item_url(mouse.id))
    assert list(lines_by_product(response)) == [str(keyboard.id)]
    assert cart_data(response)["subtotal"] == "5.00"


def test_product_removed_from_catalog_is_flagged_and_excluded_from_subtotal(api_client, catalog, add):
    mouse = catalog.add(price="10.00")
    keyboard = catalog.add(price="5.00")
    add(mouse)
    add(keyboard)
    catalog.remove(mouse.id)

    response = api_client.get(CART_URL)

    lines = lines_by_product(response)
    assert lines[str(mouse.id)]["available"] is False
    assert lines[str(keyboard.id)]["available"] is True
    assert cart_data(response)["subtotal"] == "5.00"


def test_catalog_down_returns_503_error_envelope(api_client, catalog, add):
    mouse = catalog.add()
    add(mouse)
    catalog.unavailable = True

    response = api_client.get(CART_URL)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response["Retry-After"] == "5"
    assert response.json()["error"]["code"] == "service_unavailable"
    assert add(mouse).status_code == status.HTTP_503_SERVICE_UNAVAILABLE
