import pytest
from rest_framework import status

from orders.models import Order

pytestmark = pytest.mark.django_db

ORDERS_URL = "/api/v1/orders/"


def error_code(response):
    return response.json()["error"]["code"]


def test_place_order_snapshots_prices_and_clears_the_cart(user_client, cart):
    cart.add_line(name="Mouse", price="19.99", quantity=2, image_url="http://localhost:8080/media/mouse.png")
    cart.add_line(name="Keyboard", price="89.90", quantity=1)

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    order = body["data"]
    assert (order["status"], order["subtotal"], order["total_quantity"]) == ("placed", "129.88", 3)
    mouse = next(item for item in order["items"] if item["product_name"] == "Mouse")
    assert (mouse["unit_price"], mouse["quantity"], mouse["line_total"]) == ("19.99", 2, "39.98")
    assert mouse["image_url"] == "http://localhost:8080/media/mouse.png"
    assert body["meta"]["cart_cleared"] is True
    assert cart.lines == []


def test_empty_cart_cannot_be_ordered(user_client):
    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(response) == "empty_cart"


def test_cart_with_unavailable_products_cannot_be_ordered(user_client, cart):
    cart.add_line(name="Mouse")
    cart.add_line(available=False)

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(response) == "unavailable_items"
    assert not Order.objects.exists()
    assert len(cart.lines) == 2  # nothing was cleared


def test_quantity_above_stock_cannot_be_ordered(user_client, cart):
    cart.add_line(name="Mouse", quantity=5, stock=3)

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(response) == "insufficient_stock"


def test_cart_service_down_returns_503_and_creates_nothing(user_client, cart):
    cart.add_line()
    cart.unavailable = True

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert error_code(response) == "service_unavailable"
    assert not Order.objects.exists()


def test_order_is_kept_even_if_clearing_the_cart_fails(user_client, cart):
    cart.add_line()
    cart.clear_fails = True

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["meta"]["cart_cleared"] is False
    assert Order.objects.count() == 1


def test_same_idempotency_key_returns_the_same_order(user_client, cart):
    cart.add_line()
    first = user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")

    # Double click / network retry: the cart is already empty, yet the same order comes back.
    second = user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")

    assert first.status_code == status.HTTP_201_CREATED
    assert second.status_code == status.HTTP_200_OK
    assert second.json()["data"]["id"] == first.json()["data"]["id"]
    assert Order.objects.count() == 1
