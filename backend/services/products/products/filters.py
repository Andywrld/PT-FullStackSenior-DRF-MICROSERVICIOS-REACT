import operator
import uuid
from functools import reduce

from django.contrib.postgres.lookups import Unaccent
from django.contrib.postgres.search import TrigramStrictWordSimilarity
from django.db.models import Case, CharField, Func, IntegerField, Q, Value, When
from django.db.models.functions import Length, Lower
from django.db.models.lookups import Contains, GreaterThanOrEqual
from django_filters import rest_framework as filters
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import Product

MAX_IDS = 100

# Typo tolerance (pg_trgm): a term also matches a name whose strict word similarity to it reaches
# FUZZY_THRESHOLD. Strict, because plain `word_similarity` also rewards a shared ending, so
# "labadora" scores 0.44 against "Licuadora" and 0.5 against the intended "Lavadora"; strict keeps
# the neighbours at 0.36 or less. 0.45 sits between them and still accepts one wrong or missing
# letter in words of 7+ letters ("lavdora" 0.55, "refrijerador" 0.63). pg_trgm's own default (0.6
# for word similarity) would reject those. Similarity is measured on the spelling key below, which
# is what lets a swapped letter in a short word through ("huebos" is 0.40 raw, 1.0 as a key).
FUZZY_THRESHOLD = 0.45
# Shorter terms have too few trigrams to tell a typo from a different word.
FUZZY_MIN_TERM_LENGTH = 4

# Spanish letters that sound alike are folded together, in this order, after lowercasing and
# removing accents. The same SQL runs on the search term and on the name, so they always agree.
# Not folded: "ch" (only an h that does not follow a c is silent), "gue"/"gui" (hard g) and "qu"/"k".
SPELLING_RULES = [
    ("v", "b"),
    ("z", "s"),
    ("c([ei])", r"s\1"),
    ("ll", "y"),
    ("g([ei])", r"j\1"),
    ("(?<!c)h", ""),
]
# The silent h leaves "h", "ha", "hu"... with a key of 0 or 1 letters that would match nearly
# every name, so a shorter key is not searched as a substring (the literal lookups still are).
SPELLING_MIN_KEY_LENGTH = 3

SEARCH_EXACT = "search_exact"
SEARCH_SCORE = "search_score"


def spelling_key(expression):
    """SQL expression: `expression` unaccented, lowercased and respelled by SPELLING_RULES.

    Words that sound alike get the same key: "Huevos" and "uebos" -> "uebos", "Zapato" and
    "sapato" -> "sapato". The trade-off is that real homophones collide ("casa" and "caza").
    """
    key = Lower(Unaccent(expression))
    for pattern, replacement in SPELLING_RULES:
        key = Func(
            key, Value(pattern), Value(replacement), Value("g"), function="REGEXP_REPLACE", output_field=CharField()
        )
    return key


class ProductFilter(filters.FilterSet):
    is_active = filters.BooleanFilter(field_name="is_active")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = filters.UUIDFilter(field_name="category_id")
    # Opt-in: the storefront hides sold-out products, but cart, orders and the admin need them listed.
    in_stock = filters.BooleanFilter(method="filter_in_stock")
    ids = filters.CharFilter(method="filter_ids")

    class Meta:
        model = Product
        fields = ["is_active", "min_price", "max_price", "category", "in_stock", "ids"]

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)

    def filter_ids(self, queryset, name, value):
        raw_ids = [item.strip() for item in value.split(",") if item.strip()]
        if len(raw_ids) > MAX_IDS:
            raise ValidationError({"ids": f"Accepts at most {MAX_IDS} values."})
        parsed_ids = []
        for raw_id in raw_ids:
            try:
                parsed_ids.append(uuid.UUID(raw_id))
            except ValueError:
                raise ValidationError({"ids": f"'{raw_id}' is not a valid UUID."})
        return queryset.filter(id__in=parsed_ids)


class ProductSearchFilter(SearchFilter):
    """DRF search (every term must match, a term may match any field) that forgives spelling mistakes in the name.

    A term matches through the view's `search_fields` (unaccented name, SKU), which is the literal
    tier, or through the name only: as a substring once both are respelled by `spelling_key`
    ("uevos" finds "Huevos"), or, when it has at least FUZZY_MIN_TERM_LENGTH characters, by trigram
    similarity of the two keys. The queryset gets the `search_exact` and `search_score` aliases
    that ProductOrderingFilter ranks by.
    """

    fuzzy_field = "name"

    def filter_queryset(self, request, queryset, view):
        terms = self.get_search_terms(request)
        search_fields = self.get_search_fields(view, request)
        if not terms or not search_fields:
            return queryset

        lookups = [self.construct_search(str(field), queryset) for field in search_fields]
        name_key = spelling_key(self.fuzzy_field)
        literal_matches = []
        matches = []
        similarities = []
        for term in terms:
            literal = reduce(operator.or_, (Q(**{lookup: term}) for lookup in lookups))
            term_key = spelling_key(Value(term))
            similarity = TrigramStrictWordSimilarity(term_key, name_key)
            sounds_alike = GreaterThanOrEqual(Length(term_key), SPELLING_MIN_KEY_LENGTH) & Contains(name_key, term_key)
            literal_matches.append(literal)
            similarities.append(similarity)
            match = literal | sounds_alike
            if len(term) >= FUZZY_MIN_TERM_LENGTH:
                match = match | GreaterThanOrEqual(similarity, FUZZY_THRESHOLD)
            matches.append(match)

        return queryset.filter(reduce(operator.and_, matches)).alias(
            **{
                # Matched only through the literal tier: no respelling involved.
                SEARCH_EXACT: Case(
                    When(reduce(operator.and_, literal_matches), then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                # A match that only differs in spelling has identical keys: it scores 1.0.
                SEARCH_SCORE: reduce(operator.add, similarities),
            }
        )


class ProductOrderingFilter(OrderingFilter):
    """OrderingFilter whose default, after a search, is best match first.

    Literal matches come before the rest, then the higher similarity (a match that only differs in
    spelling scores 1.0), then the view's default ordering (a stable tie-breaker for pagination).
    An `ordering` param from the client always wins.
    """

    def get_ordering(self, request, queryset, view):
        if SEARCH_SCORE not in queryset.query.annotations or self._client_ordering(request, queryset, view):
            return super().get_ordering(request, queryset, view)
        return [f"-{SEARCH_EXACT}", f"-{SEARCH_SCORE}", *(self.get_default_ordering(view) or ())]

    def _client_ordering(self, request, queryset, view):
        fields = [field.strip() for field in request.query_params.get(self.ordering_param, "").split(",")]
        return self.remove_invalid_fields(queryset, fields, view, request)
