import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from django.db import connections
from marketplace_common.errors import DomainError
from rest_framework import status

from products import services
from products.models import Product, StockDeduction

pytestmark = pytest.mark.django_db

DEDUCTIONS_URL = "/internal/v1/stock/deductions/"
PRODUCTS_URL = "/api/v1/products/"


def deduction_url(reference):
    return f"{DEDUCTIONS_URL}{reference}/"


def items(*pairs):
    """`(product_or_id, quantity)` pairs as the request lines."""
    return [{"product_id": str(getattr(product, "id", product)), "quantity": quantity} for product, quantity in pairs]


def deduction_body(*pairs, reference=None):
    return {"reference": str(reference or uuid.uuid4()), "items": items(*pairs)}


def stock_of(product):
    return Product.objects.values_list("stock", flat=True).get(pk=product.pk)


def error_of(response):
    return response.json()["error"]


def test_a_deduction_decrements_the_stock_of_every_line(api_client, product_factory):
    mouse = product_factory(stock=10)
    keyboard = product_factory(stock=4)
    updated_before = mouse.updated_at
    reference = uuid.uuid4()

    # No credentials: internal endpoints rely on network isolation, like the cart's.
    response = api_client.post(
        DEDUCTIONS_URL, deduction_body((mouse, 3), (keyboard, 4), reference=reference), format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()["data"]
    assert (data["reference"], data["released_at"]) == (str(reference), None)
    assert {line["product_id"]: line["quantity"] for line in data["items"]} == {
        str(mouse.id): 3,
        str(keyboard.id): 4,
    }
    assert (stock_of(mouse), stock_of(keyboard)) == (7, 0)
    mouse.refresh_from_db()
    assert mouse.updated_at > updated_before  # queryset updates skip auto_now: it is set by hand


def test_repeated_lines_of_a_product_are_added_up(api_client, product_factory):
    mouse = product_factory(stock=5)

    accepted = api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 2), (mouse, 2)), format="json")
    rejected = api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 1), (mouse, 1)), format="json")

    assert accepted.status_code == status.HTTP_201_CREATED
    assert accepted.json()["data"]["items"] == items((mouse, 4))
    assert rejected.status_code == status.HTTP_409_CONFLICT  # 2 wanted, 1 left
    assert stock_of(mouse) == 1


def test_a_shortage_rejects_everything_and_reports_every_offending_product(api_client, product_factory):
    plenty = product_factory(name="Plenty", stock=10)
    scarce = product_factory(name="Scarce", stock=1)
    empty = product_factory(name="Empty", stock=0)

    response = api_client.post(DEDUCTIONS_URL, deduction_body((plenty, 5), (scarce, 2), (empty, 1)), format="json")

    assert response.status_code == status.HTTP_409_CONFLICT
    error = error_of(response)
    assert error["code"] == "insufficient_stock"
    assert "Scarce (1 left)" in error["message"] and "Empty (0 left)" in error["message"]
    assert {(p["product_id"], p["requested"], p["available"]) for p in error["details"]["products"]} == {
        (str(scarce.id), 2, 1),
        (str(empty.id), 1, 0),
    }
    assert [stock_of(plenty), stock_of(scarce), stock_of(empty)] == [10, 1, 0]  # all or nothing
    assert not StockDeduction.objects.exists()


@pytest.mark.parametrize("state", ["missing", "inactive"])
def test_unknown_and_inactive_products_are_rejected_without_touching_the_rest(api_client, product_factory, state):
    available = product_factory(stock=5)
    if state == "missing":
        unavailable_id, reason = uuid.uuid4(), "not_found"
    else:
        unavailable_id, reason = product_factory(stock=5, is_active=False).id, "inactive"

    response = api_client.post(DEDUCTIONS_URL, deduction_body((available, 1), (unavailable_id, 1)), format="json")

    assert response.status_code == status.HTTP_409_CONFLICT
    error = error_of(response)
    assert error["code"] == "unavailable_items"
    assert [(p["product_id"], p["reason"]) for p in error["details"]["products"]] == [(str(unavailable_id), reason)]
    assert stock_of(available) == 5
    assert not StockDeduction.objects.exists()


def test_replaying_a_reference_does_not_deduct_twice(api_client, product_factory):
    mouse = product_factory(stock=4)
    body = deduction_body((mouse, 4))

    first = api_client.post(DEDUCTIONS_URL, body, format="json")
    # Stock is 0 now, yet the retry still succeeds: it is the same deduction, not a new one.
    second = api_client.post(DEDUCTIONS_URL, body, format="json")

    assert (first.status_code, second.status_code) == (status.HTTP_201_CREATED, status.HTTP_200_OK)
    assert second.json()["data"] == first.json()["data"]
    assert stock_of(mouse) == 0
    assert StockDeduction.objects.count() == 1


def test_release_gives_the_stock_back_exactly_once(api_client, product_factory):
    mouse = product_factory(stock=10)
    reference = uuid.uuid4()
    api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 4), reference=reference), format="json")
    assert stock_of(mouse) == 6

    first = api_client.delete(deduction_url(reference))
    second = api_client.delete(deduction_url(reference))

    # 200 with `data: null`, like every DELETE of the API (see the README).
    assert (first.status_code, second.status_code) == (status.HTTP_200_OK, status.HTTP_200_OK)
    assert first.json()["data"] is None
    assert stock_of(mouse) == 10
    assert StockDeduction.objects.get(reference=reference).released_at is not None


def test_releasing_an_unknown_reference_is_a_no_op(api_client, product_factory):
    mouse = product_factory(stock=10)

    response = api_client.delete(deduction_url(uuid.uuid4()))

    assert response.status_code == status.HTTP_200_OK
    assert stock_of(mouse) == 10


def test_release_still_restores_the_other_products_when_one_was_deleted(api_client, product_factory):
    mouse = product_factory(stock=10)
    doomed = product_factory(stock=10)
    reference = uuid.uuid4()
    api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 2), (doomed, 2), reference=reference), format="json")
    doomed.delete()

    response = api_client.delete(deduction_url(reference))

    assert response.status_code == status.HTTP_200_OK
    assert stock_of(mouse) == 10


def test_a_released_reference_cannot_be_deducted_again(api_client, product_factory):
    mouse = product_factory(stock=10)
    body = deduction_body((mouse, 4))
    api_client.post(DEDUCTIONS_URL, body, format="json")
    api_client.delete(deduction_url(body["reference"]))

    # Answering 200 would tell the caller the stock is held while it is not.
    response = api_client.post(DEDUCTIONS_URL, body, format="json")

    assert response.status_code == status.HTTP_409_CONFLICT
    assert error_of(response)["code"] == "stock_deduction_released"
    assert stock_of(mouse) == 10


def test_deducting_and_releasing_invalidate_the_catalog_cache_after_commit(
    api_client, product_factory, django_capture_on_commit_callbacks
):
    mouse = product_factory(stock=10)
    reference = uuid.uuid4()
    api_client.get(PRODUCTS_URL)
    assert api_client.get(PRODUCTS_URL)["X-Cache"] == "HIT"

    with django_capture_on_commit_callbacks(execute=True) as deduct_callbacks:
        api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 4), reference=reference), format="json")
    after_deduct = api_client.get(PRODUCTS_URL)

    with django_capture_on_commit_callbacks(execute=True) as release_callbacks:
        api_client.delete(deduction_url(reference))
    after_release = api_client.get(PRODUCTS_URL)

    assert (len(deduct_callbacks), len(release_callbacks)) == (1, 1)  # one bump per change, not per product
    assert (after_deduct["X-Cache"], after_deduct.json()["data"][0]["stock"]) == ("MISS", 6)
    assert (after_release["X-Cache"], after_release.json()["data"][0]["stock"]) == ("MISS", 10)


def test_changes_that_did_not_happen_leave_the_cache_alone(
    api_client, product_factory, django_capture_on_commit_callbacks
):
    mouse = product_factory(stock=1)
    body = deduction_body((mouse, 1))
    api_client.post(DEDUCTIONS_URL, body, format="json")

    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        api_client.post(DEDUCTIONS_URL, deduction_body((mouse, 1)), format="json")  # shortage
        api_client.post(DEDUCTIONS_URL, body, format="json")  # replay
        api_client.delete(deduction_url(uuid.uuid4()))  # unknown reference

    assert callbacks == []


@pytest.mark.parametrize(
    ("body", "field"),
    [
        ({"items": items((uuid.uuid4(), 1))}, "reference"),
        ({"reference": "nope", "items": items((uuid.uuid4(), 1))}, "reference"),
        ({"reference": str(uuid.uuid4())}, "items"),
        ({"reference": str(uuid.uuid4()), "items": []}, "items"),
        ({"reference": str(uuid.uuid4()), "items": items((uuid.uuid4(), 0))}, "items"),
        ({"reference": str(uuid.uuid4()), "items": items((uuid.uuid4(), -2))}, "items"),
        ({"reference": str(uuid.uuid4()), "items": [{"product_id": str(uuid.uuid4()), "quantity": "x"}]}, "items"),
        ({"reference": str(uuid.uuid4()), "items": [{"product_id": "nope", "quantity": 1}]}, "items"),
        ({"reference": str(uuid.uuid4()), "items": [{"quantity": 1}]}, "items"),
    ],
    ids=[
        "missing-reference",
        "bad-reference",
        "missing-items",
        "empty-items",
        "zero-quantity",
        "negative-quantity",
        "non-numeric-quantity",
        "bad-product-id",
        "missing-product-id",
    ],
)
def test_malformed_payloads_are_validation_errors(api_client, body, field):
    response = api_client.post(DEDUCTIONS_URL, body, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    error = error_of(response)
    assert error["code"] == "validation_error"
    assert field in error["details"]
    assert not StockDeduction.objects.exists()


def test_a_malformed_reference_in_the_path_is_not_found(api_client):
    assert api_client.delete(f"{DEDUCTIONS_URL}not-a-uuid/").status_code == status.HTTP_404_NOT_FOUND


def test_a_racing_duplicate_that_missed_the_first_row_is_treated_as_a_replay(product_factory, monkeypatch):
    mouse = product_factory(stock=10)
    reference = uuid.uuid4()
    lines = [{"product_id": mouse.id, "quantity": 4}]
    services.deduct_stock(reference, lines)
    # The racing call looked before the winner committed, so only the unique index stops it.
    monkeypatch.setattr(services, "_find_deduction", lambda ref: None)

    result = services.deduct_stock(reference, lines)

    assert result.applied is False
    assert stock_of(mouse) == 6


@pytest.mark.django_db(transaction=True)
def test_concurrent_calls_with_the_same_reference_deduct_once(product_factory):
    mouse = product_factory(stock=10)
    reference = uuid.uuid4()

    def call(_):
        try:
            return services.deduct_stock(reference, [{"product_id": mouse.id, "quantity": 4}]).applied
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=4) as pool:
        applied = list(pool.map(call, range(4)))

    assert sorted(applied) == [False, False, False, True]
    assert stock_of(mouse) == 6
    assert StockDeduction.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_concurrent_deductions_never_sell_the_last_unit_twice(product_factory):
    mouse = product_factory(stock=1)

    def call(_):
        try:
            services.deduct_stock(uuid.uuid4(), [{"product_id": mouse.id, "quantity": 1}])
            return "applied"
        except DomainError as exc:
            return exc.code
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=4) as pool:
        outcomes = list(pool.map(call, range(4)))

    assert sorted(outcomes) == ["applied", "insufficient_stock", "insufficient_stock", "insufficient_stock"]
    assert stock_of(mouse) == 0
