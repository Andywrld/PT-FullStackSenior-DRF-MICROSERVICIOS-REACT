import uuid

import pytest
from django.db import IntegrityError
from rest_framework import status

from orders import services
from orders.models import Order, OrderItem
from orders.stock_gateway import StockLine

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


def test_placing_an_order_deducts_the_stock_once_with_the_order_id_as_reference(user_client, cart, stock):
    mouse = cart.add_line(name="Mouse", quantity=2)
    keyboard = cart.add_line(name="Keyboard", quantity=1)

    order = user_client.post(ORDERS_URL).json()["data"]

    assert stock.deductions == [
        (uuid.UUID(order["id"]), [StockLine(mouse.product_id, 2), StockLine(keyboard.product_id, 1)])
    ]
    assert stock.releases == []


@pytest.mark.django_db(transaction=True)
def test_stock_is_deducted_outside_any_database_transaction(user_client, cart, stock):
    # A transaction kept open while waiting on another service would hold its locks for that long.
    cart.add_line()

    user_client.post(ORDERS_URL)

    assert stock.deducted_inside_transaction == [False]


def test_stock_taken_meanwhile_rejects_the_order_and_keeps_the_cart(user_client, cart, stock):
    cart.add_line(name="Mouse")
    stock.insufficient = True  # the cart snapshot looked fine, the products service disagrees

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(response) == "insufficient_stock"
    assert not Order.objects.exists()
    assert len(cart.lines) == 1
    assert stock.releases == []  # the deduction is all-or-nothing: nothing was taken


@pytest.mark.parametrize("release_fails", [False, True], ids=["release-ok", "release-fails-too"])
def test_products_service_down_returns_503_and_releases_what_may_have_been_taken(
    user_client, cart, stock, release_fails
):
    cart.add_line()
    stock.unavailable = True
    stock.release_fails = release_fails

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert error_code(response) == "service_unavailable"
    assert not Order.objects.exists()
    assert len(cart.lines) == 1
    # The unanswered call may have been applied: the keyed release is safe even if it was not.
    assert len(stock.releases) == 1


def test_an_idempotent_replay_does_not_deduct_again(user_client, cart, stock):
    cart.add_line()
    user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")

    user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")

    assert len(stock.deductions) == 1


@pytest.mark.parametrize(
    "failure", [RuntimeError("database gone"), IntegrityError("constraint")], ids=["error", "integrity-error"]
)
def test_a_failed_order_creation_gives_the_stock_back(user_client, cart, stock, monkeypatch, failure):
    cart.add_line()

    def explode(*args, **kwargs):
        raise failure

    monkeypatch.setattr(OrderItem.objects, "bulk_create", explode)

    response = user_client.post(ORDERS_URL)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert not Order.objects.exists()
    assert len(cart.lines) == 1
    assert stock.releases == [stock.deductions[0][0]]


def test_losing_the_idempotency_race_returns_the_winner_and_gives_the_duplicate_stock_back(
    user_client, cart, stock, monkeypatch
):
    cart.add_line()
    first = user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")
    cart.add_line()
    real_lookup, lookups = services._find_by_idempotency_key, []

    def lookup_missing_the_winner_at_first(user_id, key):
        lookups.append(key)
        return None if len(lookups) == 1 else real_lookup(user_id, key)

    # The second request looked before the first one committed: only the unique constraint stops it.
    monkeypatch.setattr(services, "_find_by_idempotency_key", lookup_missing_the_winner_at_first)

    second = user_client.post(ORDERS_URL, HTTP_IDEMPOTENCY_KEY="checkout-123")

    assert second.status_code == status.HTTP_200_OK
    assert second.json()["data"]["id"] == first.json()["data"]["id"]
    assert Order.objects.count() == 1
    duplicate_reference = stock.deductions[1][0]
    assert duplicate_reference != uuid.UUID(first.json()["data"]["id"])
    assert stock.releases == [duplicate_reference]
