import operator
import uuid
from functools import reduce

from django.contrib.postgres.lookups import Unaccent
from django.contrib.postgres.search import TrigramStrictWordSimilarity
from django.db.models import Case, IntegerField, Q, Value, When
from django.db.models.lookups import GreaterThanOrEqual
from django_filters import rest_framework as filters
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import Product

MAX_IDS = 100

# Typo tolerance (pg_trgm): a term also matches a name whose strict word similarity to it reaches
# FUZZY_THRESHOLD. Strict, because plain `word_similarity` also rewards a shared ending, so
# "labadora" scores 0.44 against "Licuadora" and 0.5 against the intended "Lavadora"; strict keeps
# the neighbours at 0.36 or less. 0.45 sits between them and still accepts one wrong or missing
# letter in words of 7+ letters ("labadora" 0.5, "lavdora" 0.55, "refrijerador" 0.63). pg_trgm's own
# default (0.6 for word similarity) would reject the first two.
FUZZY_THRESHOLD = 0.45
# Shorter terms have too few trigrams to tell a typo from a different word.
FUZZY_MIN_TERM_LENGTH = 4

SEARCH_EXACT = "search_exact"
SEARCH_SCORE = "search_score"


class ProductFilter(filters.FilterSet):
    is_active = filters.BooleanFilter(field_name="is_active")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = filters.UUIDFilter(field_name="category_id")
    ids = filters.CharFilter(method="filter_ids")

    class Meta:
        model = Product
        fields = ["is_active", "min_price", "max_price", "category", "ids"]

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
    """DRF search (every term must match, a term may match any field) that also forgives typos in the name.

    A term matches through the view's `search_fields` (unaccented name, SKU) or, when it has at least
    FUZZY_MIN_TERM_LENGTH characters, through its trigram similarity to the name. When a fuzzy branch
    is in play, the queryset gets the `search_exact` and `search_score` aliases that
    ProductOrderingFilter ranks by.
    """

    fuzzy_field = "name"

    def filter_queryset(self, request, queryset, view):
        terms = self.get_search_terms(request)
        search_fields = self.get_search_fields(view, request)
        if not terms or not search_fields:
            return queryset

        lookups = [self.construct_search(str(field), queryset) for field in search_fields]
        literal_matches = []
        matches = []
        similarities = []
        for term in terms:
            literal = reduce(operator.or_, (Q(**{lookup: term}) for lookup in lookups))
            literal_matches.append(literal)
            if len(term) < FUZZY_MIN_TERM_LENGTH:
                matches.append(literal)
                continue
            # Unaccented on both sides, like the `__unaccent` lookups above.
            similarity = TrigramStrictWordSimilarity(Unaccent(Value(term)), Unaccent(self.fuzzy_field))
            similarities.append(similarity)
            matches.append(literal | GreaterThanOrEqual(similarity, FUZZY_THRESHOLD))

        queryset = queryset.filter(reduce(operator.and_, matches))
        if not similarities:  # every match is literal: nothing to rank
            return queryset
        return queryset.alias(
            **{
                # Matched only through literal lookups, no fuzziness involved.
                SEARCH_EXACT: Case(
                    When(reduce(operator.and_, literal_matches), then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                SEARCH_SCORE: reduce(operator.add, similarities),
            }
        )


class ProductOrderingFilter(OrderingFilter):
    """OrderingFilter whose default, after a fuzzy search, is best match first.

    Literal matches come before fuzzy ones, then the higher similarity, then the view's default
    ordering (a stable tie-breaker for pagination). An `ordering` param from the client always wins.
    """

    def get_ordering(self, request, queryset, view):
        if SEARCH_SCORE not in queryset.query.annotations or self._client_ordering(request, queryset, view):
            return super().get_ordering(request, queryset, view)
        return [f"-{SEARCH_EXACT}", f"-{SEARCH_SCORE}", *(self.get_default_ordering(view) or ())]

    def _client_ordering(self, request, queryset, view):
        fields = [field.strip() for field in request.query_params.get(self.ordering_param, "").split(",")]
        return self.remove_invalid_fields(queryset, fields, view, request)
