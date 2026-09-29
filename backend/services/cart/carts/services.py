from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from django.db import transaction
from django.utils import timezone
from marketplace_common.errors import DomainError

from .catalog import ProductCatalog, ProductSnapshot
from .models import Cart, CartItem

ZERO = Decimal("0.00")


class ProductNotAvailableError(DomainError):
    code = "product_not_available"
    field = "product_id"
    default_message = "Product not found or not available."


class InsufficientStockError(DomainError):
    code = "insufficient_stock"
    field = "quantity"


class CartItemNotFoundError(DomainError):
    status_code = 404
    code = "cart_item_not_found"
    default_message = "This product is not in the cart."


@dataclass(frozen=True)
class CartLine:
    product_id: UUID
    quantity: int
    available: bool
    name: str | None
    image_url: str | None
    unit_price: Decimal | None
    line_total: Decimal
    stock: int | None


@dataclass(frozen=True)
class CartView:
    id: UUID
    user_id: UUID
    lines: list[CartLine]
    subtotal: Decimal
    total_quantity: int
    created_at: datetime
    updated_at: datetime


def add_item(cart: Cart, product_id: UUID, quantity: int, catalog: ProductCatalog) -> None:
    # Network call first: never hold a DB lock while waiting on another service.
    product = _get_available_product(catalog, product_id)
    with transaction.atomic():
        # Lock the cart row so concurrent adds (double click, two tabs) are
        # serialized: no lost quantity update, no duplicate line.
        Cart.objects.select_for_update().get(pk=cart.pk)
        item = cart.items.filter(product_id=product_id).first()
        new_quantity = (item.quantity if item else 0) + quantity
        _ensure_stock(product, new_quantity)
        if item:
            item.quantity = new_quantity
            item.save(update_fields=["quantity", "updated_at"])
        else:
            CartItem.objects.create(cart=cart, product_id=product_id, quantity=new_quantity)
        _touch(cart)


def set_item_quantity(cart: Cart, product_id: UUID, quantity: int, catalog: ProductCatalog) -> None:
    if not cart.items.filter(product_id=product_id).exists():
        raise CartItemNotFoundError()
    product = _get_available_product(catalog, product_id)
    _ensure_stock(product, quantity)
    with transaction.atomic():
        updated = cart.items.filter(product_id=product_id).update(
            quantity=quantity, updated_at=timezone.now()
        )
        if not updated:
            raise CartItemNotFoundError()
        _touch(cart)


def remove_item(cart: Cart, product_id: UUID) -> None:
    deleted, _ = cart.items.filter(product_id=product_id).delete()
    if not deleted:
        raise CartItemNotFoundError()
    _touch(cart)


def clear(cart: Cart) -> None:
    cart.items.all().delete()
    _touch(cart)


def build_cart_view(cart: Cart, catalog: ProductCatalog) -> CartView:
    cart.refresh_from_db(fields=["updated_at"])
    items = list(cart.items.all())
    products = catalog.get_products([item.product_id for item in items]) if items else {}
    lines = [_to_line(item, products.get(item.product_id)) for item in items]
    return CartView(
        id=cart.id,
        user_id=cart.user_id,
        lines=lines,
        subtotal=sum((line.line_total for line in lines), ZERO),
        total_quantity=sum(line.quantity for line in lines),
        created_at=cart.created_at,
        updated_at=cart.updated_at,
    )


def _get_available_product(catalog: ProductCatalog, product_id: UUID) -> ProductSnapshot:
    product = catalog.get_products([product_id]).get(product_id)
    if product is None or not product.is_active:
        raise ProductNotAvailableError()
    return product


def _ensure_stock(product: ProductSnapshot, quantity: int) -> None:
    if quantity > product.stock:
        raise InsufficientStockError(f"Only {product.stock} units available.")


def _touch(cart: Cart) -> None:
    Cart.objects.filter(pk=cart.pk).update(updated_at=timezone.now())


def _to_line(item: CartItem, product: ProductSnapshot | None) -> CartLine:
    # A product deleted or deactivated after being added stays visible (so the
    # user can remove it) but no longer counts towards the subtotal.
    available = product is not None and product.is_active
    return CartLine(
        product_id=item.product_id,
        quantity=item.quantity,
        available=available,
        name=product.name if product else None,
        image_url=product.image_url if product else None,
        unit_price=product.price if product else None,
        line_total=product.price * item.quantity if available else ZERO,
        stock=product.stock if product else None,
    )
