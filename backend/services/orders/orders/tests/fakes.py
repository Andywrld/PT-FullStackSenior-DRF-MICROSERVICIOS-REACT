import uuid
from decimal import Decimal

from orders.cart_gateway import CartLine, CartSnapshot, CartUnavailableError


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
