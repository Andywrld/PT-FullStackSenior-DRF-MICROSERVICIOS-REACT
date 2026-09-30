import pytest
from django.db.models import Value

from products.filters import spelling_key
from products.models import Product

pytestmark = pytest.mark.django_db

PRODUCTS_URL = "/api/v1/products/"


def found(client, term, **params):
    response = client.get(PRODUCTS_URL, {"search": term, **params})
    assert response.status_code == 200
    return [item["name"] for item in response.json()["data"]]


@pytest.fixture
def groceries(product_factory):
    for name in [
        "Huevos de gallina",
        "Cocina de vidrio templado",
        "Zapato deportivo",
        "Pollo entero",
        "Vino tinto",
        "Refrigerador Samsung",
        "Cebolla morada",
        "Chocolate amargo",
        "Lavadora automática Electrolux 12 kg",
        "Licuadora Oster",
        "Secadora de ropa",
    ]:
        product_factory(name=name)


@pytest.mark.parametrize(
    "raw, key",
    [
        ("Huevos de gallina", "uebos de gayina"),  # v/b, silent h, ll/y
        ("Zapato", "sapato"),  # z/s
        ("Cebolla", "seboya"),  # ce/se
        ("Cocina", "cosina"),  # ci/si, but co stays c
        ("Gente", "jente"),  # ge/je
        ("Guerra", "guerra"),  # gue keeps its hard g
        ("Chocolate", "chocolate"),  # ch keeps its sound
        ("Chhico", "chico"),  # only the h that is not part of ch goes
        ("Ñandú", "nandu"),  # accents and case are dropped first
        ("HHH", ""),
    ],
)
def test_the_spelling_key_makes_words_that_sound_alike_equal(product_factory, raw, key):
    product_factory()

    result = Product.objects.annotate(key=spelling_key(Value(raw))).values_list("key", flat=True).get()

    assert result == key


@pytest.mark.parametrize(
    "term, expected",
    [
        ("huebos", "Huevos de gallina"),  # b for v: 0.40 by trigrams alone
        ("uevos", "Huevos de gallina"),  # missing h
        ("bidrio", "Cocina de vidrio templado"),
        ("sapato", "Zapato deportivo"),
        ("poyo", "Pollo entero"),  # y for ll
        ("bino", "Vino tinto"),
        ("bin", "Vino tinto"),  # below the fuzzy minimum: the sound-alike tier has none
        ("refrijerador", "Refrigerador Samsung"),
        ("sebolla", "Cebolla morada"),
    ],
)
def test_words_spelled_as_they_sound_find_the_product(api_client, groceries, term, expected):
    assert found(api_client, term) == [expected]


@pytest.mark.parametrize(
    "term, expected",
    [("cebolla", "Cebolla morada"), ("chocolate", "Chocolate amargo"), ("CHOCOLATE", "Chocolate amargo")],
)
def test_correctly_spelled_terms_still_match(api_client, groceries, term, expected):
    assert found(api_client, term) == [expected]


def test_ch_is_not_confused_with_c(api_client, product_factory):
    product_factory(name="Choco")

    assert found(api_client, "coco") == []
    assert found(api_client, "choco") == ["Choco"]


@pytest.mark.parametrize("term", ["labadora", "lavadora"])
def test_normalizing_does_not_drag_in_words_with_the_same_ending(api_client, groceries, term):
    assert found(api_client, term) == ["Lavadora automática Electrolux 12 kg"]


@pytest.mark.parametrize("term, expected", [("h", ["Harina de trigo", "Leche entera"]), ("ha", ["Harina de trigo"])])
def test_terms_that_lose_all_their_sound_stay_literal(api_client, product_factory, term, expected):
    # Without the silent h, "ha" would look for "a" and list every name that has one.
    product_factory(name="Harina de trigo")
    product_factory(name="Arroz blanco")
    product_factory(name="Leche entera")

    assert sorted(found(api_client, term)) == expected


def test_a_literal_match_ranks_above_one_that_only_sounds_alike(api_client, product_factory):
    product_factory(name="Vaca lechera")
    product_factory(name="Baca de techo")  # newer: the default ordering alone would list it first

    assert found(api_client, "vaca") == ["Vaca lechera", "Baca de techo"]


def test_sound_alike_matches_rank_above_merely_similar_ones(api_client, product_factory):
    product_factory(name="Huevos frescos")  # literal
    product_factory(name="Huebos criollos")  # same sound: similarity 1.0
    product_factory(name="Huevo")  # newest, but only close: similarity 0.57

    assert found(api_client, "huevos") == ["Huevos frescos", "Huebos criollos", "Huevo"]


def test_an_explicit_ordering_still_wins(api_client, product_factory):
    product_factory(name="Vaca lechera")
    product_factory(name="Baca de techo")

    assert found(api_client, "vaca", ordering="name") == ["Baca de techo", "Vaca lechera"]


def test_sku_search_stays_literal(api_client, product_factory):
    product_factory(name="Mouse", sku="VIN-0007")

    assert found(api_client, "vin-0007") == ["Mouse"]
    assert found(api_client, "bin-0007") == []


def test_homophones_collide(api_client, product_factory):
    # The accepted trade-off of comparing by sound: "casa" and "caza" are the same word to the search.
    product_factory(name="Casa de campo")
    product_factory(name="Caza mayor")

    assert found(api_client, "casa") == ["Casa de campo", "Caza mayor"]  # the literal one comes first


@pytest.mark.parametrize(
    "term, expected",
    [("00%", ["Algodón 100%"]), ("a_l", ["Camiseta_larga"]), ("c:\\d", ["Ruta C:\\datos"])],
)
def test_wildcard_characters_in_the_term_are_matched_literally(api_client, product_factory, term, expected):
    product_factory(name="Algodón 100%")
    product_factory(name="Algodón 100 puro")
    product_factory(name="Camiseta_larga")
    product_factory(name="Camiseta larga")
    product_factory(name="Ruta C:\\datos")

    assert found(api_client, term) == expected


@pytest.mark.parametrize("term", ["(", "[a", "a*b", "x)", "(?<!c)h", "^$", "a|b", "\\1"])
def test_regex_syntax_in_the_term_is_just_text(api_client, groceries, term):
    assert found(api_client, term) == []
