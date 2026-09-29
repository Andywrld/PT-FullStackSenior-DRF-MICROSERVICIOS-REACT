import pytest

from products.models import Category

pytestmark = pytest.mark.django_db

PRODUCTS_URL = "/api/v1/products/"
CATEGORIES_URL = "/api/v1/categories/"
WASHER = "Lavadora automática Electrolux 12 kg"


def found(client, term, url=PRODUCTS_URL, **params):
    response = client.get(url, {"search": term, **params})
    return [item["name"] for item in response.json()["data"]]


@pytest.fixture
def appliances(product_factory):
    for name in [WASHER, "Licuadora Oster", "Secadora de ropa", "Cocina de inducción", "Refrigerador Samsung"]:
        product_factory(name=name)


@pytest.mark.parametrize(
    "term, expected",
    [
        ("labadora", WASHER),
        ("LABADORA", WASHER),
        ("lavdora", WASHER),
        ("labadora electrolux", WASHER),
        ("labadora electrolus", WASHER),
        ("refrijerador", "Refrigerador Samsung"),
        ("inducion", "Cocina de inducción"),
        ('"cocina de inducion"', "Cocina de inducción"),
    ],
)
def test_a_misspelled_term_still_finds_the_product(api_client, appliances, term, expected):
    assert found(api_client, term) == [expected]


@pytest.mark.parametrize(
    "term, expected",
    [("lavadora", WASHER), ("labadora", WASHER), ("licuadora", "Licuadora Oster")],
)
def test_similar_endings_do_not_drag_in_other_products(api_client, appliances, term, expected):
    # "-adora" is shared by the washer, the blender and the dryer: only the closest word may match.
    assert found(api_client, term) == [expected]


def test_a_completely_different_term_finds_nothing(api_client, appliances):
    assert found(api_client, "televisor") == []


@pytest.mark.parametrize(
    "term, expected",
    [
        ("labadora electrolux", [WASHER]),
        ("electrolux labadora", [WASHER]),
        ("labadora oster", []),
        ("electrolux licuadora", []),
    ],
)
def test_every_term_must_match_even_when_it_is_misspelled(api_client, appliances, term, expected):
    assert found(api_client, term) == expected


def test_sku_search_is_not_fuzzy(api_client, product_factory):
    product_factory(name="Mouse", sku="ELEC-0007")

    assert found(api_client, "elec-0007") == ["Mouse"]
    assert found(api_client, "elec-0070") == []


def test_categories_do_not_use_fuzzy_matching(api_client):
    Category.objects.create(name="Electrónica", slug="electronica")

    assert found(api_client, "electronica", url=CATEGORIES_URL) == ["Electrónica"]
    assert found(api_client, "electronika", url=CATEGORIES_URL) == []


def test_terms_shorter_than_four_characters_are_never_fuzzy(api_client, product_factory, monkeypatch):
    # With a threshold of 0 every product is "similar" to any term, so only the length guard
    # can keep the fuzzy branch out.
    monkeypatch.setattr("products.filters.FUZZY_THRESHOLD", 0.0)
    product_factory(name="Televisor Smart TV")
    product_factory(name="Cocina de inducción")

    assert found(api_client, "tv") == ["Televisor Smart TV"]
    assert found(api_client, "zzz") == []
    assert sorted(found(api_client, "zzzz")) == ["Cocina de inducción", "Televisor Smart TV"]


def test_a_short_term_does_not_bring_unrelated_products(api_client, product_factory):
    product_factory(name="Televisor Smart TV")
    product_factory(name="Cocina de inducción")
    product_factory(name="Secadora de ropa")

    assert found(api_client, "tv") == ["Televisor Smart TV"]


def test_exact_matches_rank_above_fuzzy_ones(api_client, product_factory):
    product_factory(name="Lavadora X")
    product_factory(name="Labadora Y")  # newer: the default ordering alone would list it first

    assert found(api_client, "lavadora") == ["Lavadora X", "Labadora Y"]


def test_closer_misspellings_rank_above_farther_ones(api_client, product_factory):
    product_factory(name="Lavvadora Z")
    product_factory(name="Labadora Y")  # newer, but a worse match

    assert found(api_client, "lavadora") == ["Lavvadora Z", "Labadora Y"]


def test_equally_relevant_matches_keep_the_default_ordering(api_client, product_factory):
    product_factory(name="Lavadora A")
    product_factory(name="Lavadora B")

    assert found(api_client, "lavadora") == ["Lavadora B", "Lavadora A"]


@pytest.mark.parametrize(
    "ordering, expected",
    [
        ("name", ["Labadora Y", "Lavadora X"]),
        ("-name", ["Lavadora X", "Labadora Y"]),
        ("-created_at", ["Labadora Y", "Lavadora X"]),  # the default, asked for explicitly
        ("bogus", ["Lavadora X", "Labadora Y"]),  # unknown fields are ignored: relevance applies
    ],
)
def test_an_explicit_ordering_wins_over_relevance(api_client, product_factory, ordering, expected):
    product_factory(name="Lavadora X")
    product_factory(name="Labadora Y")

    assert found(api_client, "lavadora", ordering=ordering) == expected


def test_without_a_search_the_default_ordering_applies(api_client, product_factory):
    product_factory(name="Lavadora X")
    product_factory(name="Labadora Y")

    response = api_client.get(PRODUCTS_URL)

    assert [item["name"] for item in response.json()["data"]] == ["Labadora Y", "Lavadora X"]


def test_relevance_ordering_paginates_without_repeating_or_skipping(api_client, product_factory):
    for number in range(5):
        product_factory(name=f"Labadora {number}")  # same similarity: the tie is broken by creation
    product_factory(name="Lavadora exacta")

    pages = [found(api_client, "lavadora", page_size=2, page=page) for page in (1, 2, 3)]
    everything = found(api_client, "lavadora", page_size=100)

    assert [name for page in pages for name in page] == everything
    assert len(set(everything)) == 6
    assert everything[0] == "Lavadora exacta"
