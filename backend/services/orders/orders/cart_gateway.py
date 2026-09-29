from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol
from uuid import UUID

from django.conf import settings
from django.utils.module_loading import import_string
from marketplace_common.errors import ServiceUnavailableError


@dataclass(frozen=True)
class CartLine:

    product_id: UUID
    name: str | None
    unit_price: Decimal | None
    quantity: int
    stock: int | None
    available: bool
    image_url: str | None = None


@dataclass(frozen=True)
class CartSnapshot:
    lines: list[CartLine]


class CartUnavailableError(ServiceUnavailableError):
    default_message = "The cart service is temporarily unavailable. Please try again."


class CartGateway(Protocol):

    def get_cart(self, user_id: UUID) -> CartSnapshot: ...

    def clear_cart(self, user_id: UUID) -> None: ...


def get_cart_gateway() -> CartGateway:
    return import_string(settings.CART_GATEWAY_CLASS)()
