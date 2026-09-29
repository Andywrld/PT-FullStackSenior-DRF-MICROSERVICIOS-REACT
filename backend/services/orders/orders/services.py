import logging
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID, uuid4

from django.db import IntegrityError, transaction
from marketplace_common.errors import DomainError

from .cart_gateway import CartGateway, CartSnapshot, CartUnavailableError
from .models import Order, OrderItem
from .stock_gateway import StockGateway, StockLine, StockUnavailableError

logger = logging.getLogger(__name__)

CENTS = Decimal("0.01")
ZERO = Decimal("0.00")


class EmptyCartError(DomainError):
    code = "empty_cart"
    default_message = "The cart is empty."


class UnavailableItemsError(DomainError):
    code = "unavailable_items"
    field = "product_id"


class InsufficientStockError(DomainError):
    code = "insufficient_stock"
    field = "quantity"


@dataclass(frozen=True)
class PlaceOrderResult:
    order: Order
    created: bool
    cart_cleared: bool


def place_order(
    user, cart_gateway: CartGateway, stock_gateway: StockGateway, idempotency_key: str | None = None
) -> PlaceOrderResult:
    if idempotency_key:
        existing = _find_by_idempotency_key(user.id, idempotency_key)
        if existing is not None:
            return PlaceOrderResult(order=existing, created=False, cart_cleared=False)

    cart = cart_gateway.get_cart(user.id)  # CartUnavailableError -> 503 via the shared handler
    _validate(cart)

    # The order id doubles as the stock deduction's reference. The deduction happens before the order
    # exists and outside any transaction: never hold a database lock while waiting on another service.
    order_id = uuid4()
    _deduct_stock(stock_gateway, order_id, cart.lines)

    try:
        with transaction.atomic():
            order = Order.objects.create(
                id=order_id,
                user_id=user.id,
                customer_email=user.email,
                subtotal=_quantize(sum((_line_total(line) for line in cart.lines), ZERO)),
                total_quantity=sum(line.quantity for line in cart.lines),
                idempotency_key=idempotency_key,
            )
            OrderItem.objects.bulk_create(
                OrderItem(
                    order=order,
                    product_id=line.product_id,
                    product_name=line.name,
                    image_url=line.image_url,
                    unit_price=_quantize(line.unit_price),
                    quantity=line.quantity,
                    line_total=_quantize(_line_total(line)),
                )
                for line in cart.lines
            )
    except IntegrityError:
        _release_stock_best_effort(stock_gateway, order_id)
        # Concurrent double submit raced us on the (user_id, idempotency_key)
        # unique constraint: the other request won, so return its order.
        existing = _find_by_idempotency_key(user.id, idempotency_key) if idempotency_key else None
        if existing is None:
            raise  # not that race: a real failure
        return PlaceOrderResult(order=existing, created=False, cart_cleared=False)
    except Exception:
        _release_stock_best_effort(stock_gateway, order_id)
        raise

    # Best effort: the order is already committed and must not be lost if the cart service
    # is down (production would retry via an outbox/job).
    cart_cleared = _clear_cart_best_effort(cart_gateway, user.id, order.id)
    return PlaceOrderResult(order=order, created=True, cart_cleared=cart_cleared)


def _find_by_idempotency_key(user_id: UUID, idempotency_key: str) -> Order | None:
    return Order.objects.filter(user_id=user_id, idempotency_key=idempotency_key).first()


def _validate(cart: CartSnapshot) -> None:
    if not cart.lines:
        raise EmptyCartError()
    unavailable = [line for line in cart.lines if not line.available]
    if unavailable:
        products = ", ".join(line.name or str(line.product_id) for line in unavailable)
        raise UnavailableItemsError(f"These products are no longer available: {products}.")
    over_stock = [line for line in cart.lines if line.quantity > line.stock]
    if over_stock:
        details = ", ".join(f"{line.name} ({line.stock} left)" for line in over_stock)
        raise InsufficientStockError(f"Not enough stock for: {details}.")


def _line_total(line) -> Decimal:
    return line.unit_price * line.quantity


def _quantize(amount: Decimal) -> Decimal:
    return amount.quantize(CENTS, rounding=ROUND_HALF_UP)


def _clear_cart_best_effort(gateway: CartGateway, user_id: UUID, order_id: UUID) -> bool:
    try:
        gateway.clear_cart(user_id)
        return True
    except CartUnavailableError:
        logger.warning("Order %s placed but the cart could not be cleared for user %s", order_id, user_id)
        return False


def _deduct_stock(stock_gateway: StockGateway, order_id: UUID, lines) -> None:
    try:
        stock_lines = [StockLine(product_id=line.product_id, quantity=line.quantity) for line in lines]
        stock_gateway.deduct(order_id, stock_lines)
    except StockUnavailableError:
        # No answer: the catalog may have applied the deduction anyway. Releasing by the same
        # reference is safe either way.
        _release_stock_best_effort(stock_gateway, order_id)
        raise


def _release_stock_best_effort(stock_gateway: StockGateway, order_id: UUID) -> None:
    # If this fails too, the stock stays held until someone reconciles (production would retry or sweep).
    try:
        stock_gateway.release(order_id)
    except StockUnavailableError:
        logger.warning("Stock held for the unplaced order %s could not be released", order_id)
