import pytest
from django.core.management import call_command

from products.models import Product

pytestmark = pytest.mark.django_db


def test_startup_seed_never_touches_a_catalog_that_already_has_products(product_factory):
    product = product_factory(name="Editado desde el admin")

    call_command("seed_products", "--if-empty")

    assert list(Product.objects.values_list("name", flat=True)) == [product.name]
