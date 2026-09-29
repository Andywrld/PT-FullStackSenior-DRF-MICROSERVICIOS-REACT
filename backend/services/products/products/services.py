from dataclasses import dataclass
from uuid import UUID

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from marketplace_common.errors import DomainError

from . import catalog_cache
from .models import Product, StockDeduction


class InsufficientStockError(DomainError):
    status_code = 409
    code = "insufficient_stock"


class UnavailableProductsError(DomainError):
    status_code = 409
    code = "unavailable_items"


class DeductionReleasedError(DomainError):
    status_code = 409
    code = "stock_deduction_released"
    default_message = "This stock deduction was already released."


@dataclass(frozen=True)
class DeductionResult:
    deduction: StockDeduction
    applied: bool  # False when the reference had already been deducted (a replay)


def deduct_stock(reference: UUID, items) -> DeductionResult:
    """Take the stock of every line, or of none: all-or-nothing.

    Idempotent by `reference`, so callers may retry freely: a repeated call answers
    with the original deduction without touching the stock again.
    """
    quantities = _aggregate(items)
    existing = _find_deduction(reference)
    if existing is not None:
        return _replay(existing)

    with transaction.atomic():
        try:
            with transaction.atomic():  # savepoint: a failed INSERT must not abort the outer transaction
                deduction = StockDeduction.objects.create(reference=reference, items=_to_json(quantities))
        except IntegrityError:
            # A concurrent call with the same reference got in first (the INSERT waited for its
            # commit or rollback, so this is a genuine duplicate): answer with its deduction.
            return _replay(StockDeduction.objects.get(reference=reference))

        _ensure_available(quantities, _lock_products(quantities))

        now = timezone.now()
        for product_id, quantity in quantities.items():
            # F() plus the row lock; update() skips auto_now and the signals, hence both by hand.
            Product.objects.filter(pk=product_id).update(stock=F("stock") - quantity, updated_at=now)
        transaction.on_commit(catalog_cache.bump_version, robust=True)
    return DeductionResult(deduction=deduction, applied=True)


def release_stock(reference: UUID) -> bool:
    """Give a deduction's stock back. Unknown or already released references do nothing.

    Returns whether stock was actually restored.
    """
    with transaction.atomic():
        deduction = StockDeduction.objects.select_for_update().filter(reference=reference).first()
        if deduction is None or deduction.released_at is not None:
            return False

        quantities = {UUID(line["product_id"]): line["quantity"] for line in deduction.items}
        _lock_products(quantities)

        now = timezone.now()
        for product_id, quantity in quantities.items():
            # A product deleted since then simply matches no row.
            Product.objects.filter(pk=product_id).update(stock=F("stock") + quantity, updated_at=now)
        deduction.released_at = now
        deduction.save(update_fields=["released_at"])
        transaction.on_commit(catalog_cache.bump_version, robust=True)
    return True


def _lock_products(product_ids) -> dict[UUID, Product]:
    # Ordered by id: concurrent calls over the same products lock them in the same order, so they cannot deadlock.
    locked = Product.objects.select_for_update().filter(id__in=list(product_ids)).order_by("id")
    return {product.id: product for product in locked}


def _find_deduction(reference: UUID) -> StockDeduction | None:
    return StockDeduction.objects.filter(reference=reference).first()


def _replay(deduction: StockDeduction) -> DeductionResult:
    if deduction.released_at is not None:
        # Answering 200 would tell the caller the stock is held when it is not.
        raise DeductionReleasedError()
    return DeductionResult(deduction=deduction, applied=False)


def _aggregate(items) -> dict[UUID, int]:
    """Total per product, in id order (the order the rows are locked in)."""
    totals: dict[UUID, int] = {}
    for item in items:
        product_id = UUID(str(item["product_id"]))
        totals[product_id] = totals.get(product_id, 0) + item["quantity"]
    return dict(sorted(totals.items()))


def _to_json(quantities: dict[UUID, int]) -> list[dict]:
    return [{"product_id": str(product_id), "quantity": quantity} for product_id, quantity in quantities.items()]


def _ensure_available(quantities: dict[UUID, int], products: dict[UUID, Product]) -> None:
    """Raise with every problem at once, so the caller can fix the whole order in one go."""
    problems = []
    unavailable = []  # names for the message
    short = []
    for product_id, quantity in quantities.items():
        product = products.get(product_id)
        if product is None:
            problems.append({"product_id": str(product_id), "reason": "not_found"})
            unavailable.append(str(product_id))
        elif not product.is_active:
            problems.append({"product_id": str(product_id), "reason": "inactive"})
            unavailable.append(product.name)
        elif product.stock < quantity:
            problems.append(
                {
                    "product_id": str(product_id),
                    "reason": "insufficient_stock",
                    "requested": quantity,
                    "available": product.stock,
                }
            )
            short.append(f"{product.name} ({product.stock} left)")
    if not problems:
        return

    details = {"products": problems}
    if unavailable:
        raise UnavailableProductsError(f"These products are no longer available: {', '.join(unavailable)}.", details)
    raise InsufficientStockError(f"Not enough stock for: {', '.join(short)}.", details)
