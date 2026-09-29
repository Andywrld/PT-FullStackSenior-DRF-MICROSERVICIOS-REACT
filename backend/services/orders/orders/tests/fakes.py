import uuid
from decimal import Decimal
from types import SimpleNamespace

from django.db import connection

from orders.cart_gateway import CartLine, CartSnapshot, CartUnavailableError
from orders.services import InsufficientStockError
from orders.stock_gateway import StockUnavailableError


class FakeCartGateway:
    """In-memory CartGateway. State is class-level because the app builds a
    fresh gateway per request (see orders.cart_gateway.get_cart_gateway)."""

    lines: list[CartLine] = []
    unavailable = False
    clear_fails = False

    @classmethod
    def reset(cls):
        cls.lines = []
        cls.unavailable = False
        cls.clear_fails = False

    @classmethod
    def add_line(cls, name="Product", price="10.00", quantity=1, stock=10, available=True, image_url=None):
        line = CartLine(
            product_id=uuid.uuid4(),
            name=name if available else None,
            unit_price=Decimal(price) if available else None,
            quantity=quantity,
            stock=stock if available else None,
            available=available,
            image_url=image_url,
        )
        cls.lines = [*cls.lines, line]
        return line

    def get_cart(self, user_id):
        if self.unavailable:
            raise CartUnavailableError()
        return CartSnapshot(lines=list(self.lines))

    def clear_cart(self, user_id):
        if self.clear_fails:
            raise CartUnavailableError()
        type(self).lines = []


class FakeStockGateway:
    """In-memory StockGateway that records what the use case asked for. State is
    class-level because the app builds a fresh gateway per request."""

    deductions: list[tuple[uuid.UUID, list]] = []
    deducted_inside_transaction: list[bool] = []
    releases: list[uuid.UUID] = []
    unavailable = False
    insufficient = False
    release_fails = False

    @classmethod
    def reset(cls):
        cls.deductions = []
        cls.deducted_inside_transaction = []
        cls.releases = []
        cls.unavailable = False
        cls.insufficient = False
        cls.release_fails = False

    def deduct(self, reference, lines):
        if self.unavailable:
            raise StockUnavailableError()
        if self.insufficient:
            raise InsufficientStockError("Not enough stock for: Mouse (0 left).")
        type(self).deductions.append((reference, list(lines)))
        type(self).deducted_inside_transaction.append(connection.in_atomic_block)

    def release(self, reference):
        type(self).releases.append(reference)  # attempts count, even the failing ones
        if self.release_fails:
            raise StockUnavailableError()


class FakeSession:
    """Records request() calls; returns a canned response or raises a canned error."""

    def __init__(self, outcome):
        self.outcome = outcome
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append(SimpleNamespace(method=method, url=url, **kwargs))
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


def fake_response(status_code, payload=None):
    return SimpleNamespace(status_code=status_code, json=lambda: payload)
