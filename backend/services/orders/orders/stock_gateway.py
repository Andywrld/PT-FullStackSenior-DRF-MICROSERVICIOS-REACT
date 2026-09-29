from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from django.conf import settings
from django.utils.module_loading import import_string
from marketplace_common.errors import ServiceUnavailableError


@dataclass(frozen=True)
class StockLine:
    product_id: UUID
    quantity: int


class StockUnavailableError(ServiceUnavailableError):
    default_message = "The catalog service is temporarily unavailable. Please try again."


class StockGateway(Protocol):
    """Stock held for an order, keyed by the order id: both calls are idempotent by `reference`.

    `deduct` is all-or-nothing and raises `orders.services.InsufficientStockError` or
    `UnavailableItemsError` when the catalog refuses, `StockUnavailableError` when it
    cannot be reached (the outcome is then unknown). `release` gives the stock back and
    does nothing for an unknown or already released reference.
    """

    def deduct(self, reference: UUID, lines: list[StockLine]) -> None: ...

    def release(self, reference: UUID) -> None: ...


def get_stock_gateway() -> StockGateway:
    return import_string(settings.STOCK_GATEWAY_CLASS)()
