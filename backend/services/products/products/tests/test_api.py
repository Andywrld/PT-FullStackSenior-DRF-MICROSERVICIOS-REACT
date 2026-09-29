import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db

LIST_URL = "/api/v1/products/"
PAYLOAD = {"sku": "abc-123", "name": "Keyboard", "price": "19.99", "stock": 5}


def detail_url(product_id):
    return f"/api/v1/products/{product_id}/"


def test_list_returns_envelope_with_pagination_meta(api_client, product_factory):
    for i in range(3):
        product_factory(sku=f"PAG-{i}")

    body = api_client.get(LIST_URL, {"page_size": 2}).json()

    assert body["success"] is True
    assert body["error"] is None
    assert len(body["data"]) == 2
    assert body["meta"]["pagination"] == {
        "page": 1,
        "page_size": 2,
        "total_items": 3,
        "total_pages": 2,
        "has_next": True,
        "has_previous": False,
    }
    assert body["meta"]["request_id"]


def test_validation_error_returns_error_envelope(admin_client):
    response = admin_client.post(LIST_URL, {**PAYLOAD, "price": "-1.00"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    body = response.json()
    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == "validation_error"
    assert "price" in body["error"]["details"]


def test_regular_user_cannot_write(user_client):
    response = user_client.post(LIST_URL, PAYLOAD, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error"]["code"] == "permission_denied"


def test_create_product_duplicate_sku_different_case_returns_400(admin_client, product_factory):
    product_factory(sku="CASE-1", name="Existing")

    response = admin_client.post(LIST_URL, {**PAYLOAD, "sku": "case-1"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "sku" in response.json()["error"]["details"]


def test_filter_by_ids_returns_only_requested_products(api_client, product_factory):
    p1 = product_factory(sku="IDF-1")
    p2 = product_factory(sku="IDF-2")
    product_factory(sku="IDF-3")

    body = api_client.get(LIST_URL, {"ids": f"{p1.id},{p2.id}"}).json()

    assert {item["id"] for item in body["data"]} == {str(p1.id), str(p2.id)}
