from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePagination(PageNumberPagination):

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        paginator = self.page.paginator
        response = Response(data)
        response.envelope_meta = {
            "pagination": {
                "page": self.page.number,
                "page_size": paginator.per_page,
                "total_items": paginator.count,
                "total_pages": paginator.num_pages,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
            }
        }
        return response

    def get_paginated_response_schema(self, schema):
        return schema
