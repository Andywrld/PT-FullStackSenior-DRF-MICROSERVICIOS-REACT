from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

pytestmark = pytest.mark.django_db

ORDERS_URL = "/api/v1/orders/"


def place_order(client, cart):
    cart.add_line()
    return client.post(ORDERS_URL).json()["data"]


def test_users_see_only_their_orders_and_admins_see_all(make_client, cart):
    alice, bob, admin = make_client(), make_client(), make_client("admin")
    alice_order = place_order(alice, cart)
    place_order(bob, cart)

    alice_list = alice.get(ORDERS_URL).json()
    assert [order["id"] for order in alice_list["data"]] == [alice_order["id"]]
    assert alice_list["meta"]["pagination"]["total_items"] == 1

    assert admin.get(ORDERS_URL).json()["meta"]["pagination"]["total_items"] == 2
    filtered = admin.get(ORDERS_URL, {"user_id": str(alice.user_id)}).json()
    assert [order["id"] for order in filtered["data"]] == [alice_order["id"]]


def test_a_user_cannot_read_someone_elses_order(make_client, cart):
    alice, bob = make_client(), make_client()
    alice_order = place_order(alice, cart)

    response = bob.get(f"{ORDERS_URL}{alice_order['id']}/")

    # 404, not 403: it doesn't even confirm the order exists.
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_malformed_ids_are_client_errors_not_crashes(make_client):
    admin = make_client("admin")

    assert admin.get(f"{ORDERS_URL}not-a-uuid/").status_code == status.HTTP_404_NOT_FOUND
    response = admin.get(ORDERS_URL, {"user_id": "not-a-uuid"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["error"]["code"] == "validation_error"


def ids(client, params):
    return [order["id"] for order in client.get(ORDERS_URL, params).json()["data"]]


def test_admins_search_by_email_or_order_number_and_sort_by_total(make_client, cart):
    alice, bob = make_client(email="alice@example.com"), make_client(email="bob@example.com")
    admin = make_client("admin")
    cart.add_line(price="5.00")
    alice_order = alice.post(ORDERS_URL).json()["data"]
    cart.add_line(price="50.00")
    bob_order = bob.post(ORDERS_URL).json()["data"]

    assert ids(admin, {"search": "alice"}) == [alice_order["id"]]
    assert ids(admin, {"search": bob_order["id"][:8].upper()}) == [bob_order["id"]]
    assert ids(admin, {"ordering": "-subtotal"}) == [bob_order["id"], alice_order["id"]]


def test_admins_filter_orders_by_creation_date(make_client, cart):
    admin = make_client("admin")
    order = place_order(make_client(), cart)
    now = timezone.now()

    assert ids(admin, {"created_after": (now - timedelta(hours=1)).isoformat()}) == [order["id"]]
    assert ids(admin, {"created_after": (now + timedelta(hours=1)).isoformat()}) == []
    assert admin.get(ORDERS_URL, {"created_after": "yesterday"}).status_code == status.HTTP_400_BAD_REQUEST
