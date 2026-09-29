import pytest

from products.models import Category

pytestmark = pytest.mark.django_db

PRODUCTS_URL = "/api/v1/products/"
CATEGORIES_URL = "/api/v1/categories/"


def names(client, url, term):
    return [item["name"] for item in client.get(url, {"search": term}).json()["data"]]


@pytest.mark.parametrize("term", ["cafe", "café", "CAFÉ", "Cafe", "caf", "cafe mol", "MOLIDO"])
def test_products_are_found_regardless_of_accents_and_case(api_client, product_factory, term):
    product_factory(name="Café Molido")
    product_factory(name="Té Verde")

    assert names(api_client, PRODUCTS_URL, term) == ["Café Molido"]


def test_a_name_without_accents_is_found_by_an_accented_term(api_client, product_factory):
    product_factory(name="Cafe")

    assert names(api_client, PRODUCTS_URL, "café") == ["Cafe"]


def test_products_are_still_found_by_sku(api_client, product_factory):
    product_factory(name="Mouse", sku="ELEC-0007")
    product_factory(name="Teclado", sku="ELEC-0008")

    assert names(api_client, PRODUCTS_URL, "elec-0007") == ["Mouse"]


def test_categories_are_found_regardless_of_accents(api_client):
    Category.objects.create(name="Electrónica", slug="electronica")
    Category.objects.create(name="Jardín", slug="jardin")

    assert names(api_client, CATEGORIES_URL, "electronica") == ["Electrónica"]
    assert names(api_client, CATEGORIES_URL, "JARDÍN") == ["Jardín"]


def test_cached_results_never_answer_a_different_search(api_client, product_factory):
    product_factory(name="Café Molido")
    api_client.get(PRODUCTS_URL, {"search": "cafe"})

    cached = api_client.get(PRODUCTS_URL, {"search": "cafe"})
    other = api_client.get(PRODUCTS_URL, {"search": "café"})
    nothing = api_client.get(PRODUCTS_URL, {"search": "zzz"})

    # The search string is part of the cache key: each spelling is looked up (and cached) on its own.
    assert (cached["X-Cache"], other["X-Cache"], nothing["X-Cache"]) == ("HIT", "MISS", "MISS")
    assert [len(r.json()["data"]) for r in (cached, other, nothing)] == [1, 1, 0]
