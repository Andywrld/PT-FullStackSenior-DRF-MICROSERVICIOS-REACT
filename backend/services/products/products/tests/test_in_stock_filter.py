import pytest

from products.models import Category

pytestmark = pytest.mark.django_db

PRODUCTS_URL = "/api/v1/products/"


def listed(client, **params):
    return sorted(item["name"] for item in client.get(PRODUCTS_URL, params).json()["data"])


@pytest.fixture
def catalog(product_factory):
    product_factory(name="In stock", stock=3)
    product_factory(name="Last unit", stock=1)
    product_factory(name="Sold out", stock=0)


@pytest.mark.parametrize("value", ["true", "True", "1"])
def test_in_stock_true_hides_sold_out_products(api_client, catalog, value):
    assert listed(api_client, in_stock=value) == ["In stock", "Last unit"]


@pytest.mark.parametrize("value", ["false", "False", "0"])
def test_in_stock_false_returns_only_sold_out_products(api_client, catalog, value):
    assert listed(api_client, in_stock=value) == ["Sold out"]


@pytest.mark.parametrize("params", [{}, {"in_stock": ""}])
def test_without_the_filter_every_product_is_listed(api_client, catalog, params):
    assert listed(api_client, **params) == ["In stock", "Last unit", "Sold out"]


def test_the_filter_combines_with_the_other_filters(api_client, product_factory):
    category = Category.objects.create(name="Appliances", slug="appliances")
    product_factory(name="Lavadora activa", stock=2, category=category, price=100)
    product_factory(name="Lavadora agotada", stock=0, category=category, price=100)
    product_factory(name="Lavadora inactiva", stock=2, category=category, price=100, is_active=False)
    product_factory(name="Lavadora cara", stock=2, category=category, price=900)
    product_factory(name="Lavadora sin categoría", stock=2, price=100)

    everything = listed(
        api_client, is_active="true", in_stock="true", category=category.id, max_price=500, search="lavadora"
    )
    sold_out = listed(api_client, is_active="true", in_stock="false", category=category.id, search="lavadora")

    assert everything == ["Lavadora activa"]
    assert sold_out == ["Lavadora agotada"]


def test_the_filter_keeps_fuzzy_search_ranking(api_client, product_factory):
    product_factory(name="Lavadora X", stock=1)
    product_factory(name="Labadora Y", stock=1)
    product_factory(name="Lavadora agotada", stock=0)

    response = api_client.get(PRODUCTS_URL, {"search": "lavadora", "in_stock": "true"})

    assert [item["name"] for item in response.json()["data"]] == ["Lavadora X", "Labadora Y"]


def test_sold_out_products_stay_visible_by_default_for_the_cart(api_client, product_factory):
    # Cart and orders resolve their lines with `?ids=`: a sold-out line must come back, not vanish.
    sold_out = product_factory(name="Sold out", stock=0)

    listed_by_id = api_client.get(PRODUCTS_URL, {"ids": str(sold_out.id)}).json()["data"]

    assert [(item["id"], item["stock"]) for item in listed_by_id] == [(str(sold_out.id), 0)]


def test_a_sold_out_product_detail_stays_reachable(api_client, product_factory):
    sold_out = product_factory(name="Sold out", stock=0)

    response = api_client.get(f"{PRODUCTS_URL}{sold_out.id}/")

    assert response.status_code == 200
    assert response.json()["data"]["stock"] == 0


def test_cached_lists_never_answer_a_different_stock_filter(api_client, catalog):
    api_client.get(PRODUCTS_URL)

    hidden = api_client.get(PRODUCTS_URL, {"in_stock": "true"})
    shown = api_client.get(PRODUCTS_URL)

    assert (hidden["X-Cache"], shown["X-Cache"]) == ("MISS", "HIT")
    assert [len(r.json()["data"]) for r in (hidden, shown)] == [2, 3]
