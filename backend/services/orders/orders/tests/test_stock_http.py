import uuid

import pytest
import requests
from django.conf import settings

from orders import stock_http
from orders.services import InsufficientStockError, UnavailableItemsError
from orders.stock_gateway import StockLine, StockUnavailableError
from orders.stock_http import HttpStockGateway
from orders.tests.fakes import FakeSession, fake_response

BASE_URL = "http://products:8000"


def make_gateway(outcome):
    session = FakeSession(outcome)
    return HttpStockGateway(session=session, base_url=BASE_URL), session


def rejection(code, message="Rejected.", details=None):
    error = {"code": code, "message": message, "details": details}
    return fake_response(409, {"success": False, "data": None, "error": error, "meta": {}})


def test_deduct_posts_the_reference_and_the_lines_with_the_request_id(monkeypatch):
    monkeypatch.setattr("orders.stock_http.get_request_id", lambda: "req-123")
    gateway, session = make_gateway(fake_response(201, {"data": {}}))
    reference, product_id = uuid.uuid4(), uuid.uuid4()

    gateway.deduct(reference, [StockLine(product_id, 2)])

    (call,) = session.calls
    assert (call.method, call.url) == ("post", f"{BASE_URL}/internal/v1/stock/deductions/")
    assert call.json == {"reference": str(reference), "items": [{"product_id": str(product_id), "quantity": 2}]}
    assert call.headers["X-Request-ID"] == "req-123"
    assert call.timeout == settings.PRODUCTS_SERVICE_TIMEOUT


@pytest.mark.parametrize("status_code", [200, 201], ids=["replay", "applied"])
def test_deduct_accepts_both_applied_and_replayed_answers(status_code):
    gateway, _ = make_gateway(fake_response(status_code, {"data": {}}))

    assert gateway.deduct(uuid.uuid4(), [StockLine(uuid.uuid4(), 1)]) is None


def test_a_stock_shortage_becomes_insufficient_stock_and_keeps_the_details():
    products = [{"product_id": "p-1", "reason": "insufficient_stock", "requested": 2, "available": 1}]
    message = "Not enough stock for: Mouse (1 left)."
    gateway, _ = make_gateway(rejection("insufficient_stock", message, {"products": products}))

    with pytest.raises(InsufficientStockError, match=r"Mouse \(1 left\)") as raised:
        gateway.deduct(uuid.uuid4(), [StockLine(uuid.uuid4(), 2)])

    assert raised.value.details == {"products": products}


def test_products_that_disappeared_become_unavailable_items():
    gateway, _ = make_gateway(rejection("unavailable_items", "These products are no longer available: Mouse."))

    with pytest.raises(UnavailableItemsError, match="Mouse"):
        gateway.deduct(uuid.uuid4(), [StockLine(uuid.uuid4(), 1)])


@pytest.mark.parametrize(
    "outcome",
    [
        requests.ConnectionError("connection refused"),
        requests.Timeout("read timed out"),
        fake_response(500),
        fake_response(503),
        fake_response(400, {"error": {"code": "validation_error"}}),
        rejection("stock_deduction_released"),
        fake_response(409, None),
    ],
    ids=[
        "network-error",
        "timeout",
        "server-error",
        "unavailable",
        "bad-request",
        "unknown-conflict",
        "unreadable-conflict",
    ],
)
def test_anything_else_is_a_stock_service_outage(outcome):
    gateway, _ = make_gateway(outcome)

    with pytest.raises(StockUnavailableError):
        gateway.deduct(uuid.uuid4(), [StockLine(uuid.uuid4(), 1)])


@pytest.mark.parametrize("status_code", [200, 204, 404], ids=["released", "no-content", "nothing-to-release"])
def test_release_deletes_the_deduction_and_accepts_an_unknown_one(status_code):
    gateway, session = make_gateway(fake_response(status_code))
    reference = uuid.uuid4()

    assert gateway.release(reference) is None

    (call,) = session.calls
    assert (call.method, call.url) == ("delete", f"{BASE_URL}/internal/v1/stock/deductions/{reference}/")


@pytest.mark.parametrize(
    "outcome",
    [requests.ConnectionError("connection refused"), fake_response(503)],
    ids=["network-error", "server-error"],
)
def test_a_release_that_cannot_be_confirmed_raises_stock_unavailable(outcome):
    gateway, _ = make_gateway(outcome)

    with pytest.raises(StockUnavailableError):
        gateway.release(uuid.uuid4())


def test_the_shared_session_retries_posts_and_deletes_because_they_are_idempotent():
    retry = stock_http._default_session().get_adapter(BASE_URL).max_retries

    assert {"POST", "DELETE"} <= set(retry.allowed_methods)
    assert retry.total == settings.PRODUCTS_SERVICE_RETRIES
