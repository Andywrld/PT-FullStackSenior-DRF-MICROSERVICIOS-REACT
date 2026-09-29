import uuid
from decimal import Decimal

from carts.catalog import CatalogUnavailableError, ProductSnapshot


class FakeProductCatalog:
    """In-memory ProductCatalog. State is class-level because the app builds a
    fresh catalog instance per request (see carts.catalog.get_product_catalog)."""

    products: dict[uuid.UUID, ProductSnapshot] = {}
    unavailable = False

    @classmethod
    def reset(cls):
        cls.products = {}
        cls.unavailable = False

    @classmethod
    def add(cls, name="Product", price="10.00", stock=10, is_active=True):
        product = ProductSnapshot(
            id=uuid.uuid4(),
            name=name,
            price=Decimal(price),
            stock=stock,
            is_active=is_active,
            image_url=f"http://img.test/{name}.png",
        )
        cls.products[product.id] = product
        return product

    @classmethod
    def remove(cls, product_id):
        cls.products.pop(product_id)

    def get_products(self, product_ids):
        if self.unavailable:
            raise CatalogUnavailableError("fake catalog is down")
        return {pid: self.products[pid] for pid in product_ids if pid in self.products}
