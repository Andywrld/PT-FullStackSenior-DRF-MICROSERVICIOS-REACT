from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, Protocol
from uuid import UUID

from django.conf import settings
from django.utils.module_loading import import_string
from marketplace_common.errors import ServiceUnavailableError


@dataclass(frozen=True)
class ProductSnapshot:

    id: UUID
    name: str
    price: Decimal
    stock: int
    is_active: bool
    image_url: str | None = None


class CatalogUnavailableError(ServiceUnavailableError):

    default_message = "The product catalog is temporarily unavailable. Please try again."


class ProductCatalog(Protocol):
    def get_products(self, product_ids: Iterable[UUID]) -> dict[UUID, ProductSnapshot]:
        ...


def get_product_catalog() -> ProductCatalog:
    return import_string(settings.PRODUCT_CATALOG_CLASS)()
