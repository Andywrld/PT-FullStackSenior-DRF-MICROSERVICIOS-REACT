import io

import pytest
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test.utils import CaptureQueriesContext
from PIL import Image
from rest_framework import status

from products.models import ProductImage

pytestmark = pytest.mark.django_db


def images_url(product_id):
    return f"/api/v1/products/{product_id}/images/"


def make_png(size=(40, 30), name="photo.png"):
    buffer = io.BytesIO()
    Image.new("RGB", size, color=(200, 30, 30)).save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


def upload(client, product, file=None):
    return client.post(images_url(product.id), {"image": file or make_png()}, format="multipart")


def test_upload_valid_image_returns_201_and_appears_in_product(admin_client, api_client, product_factory):
    product = product_factory()

    response = upload(admin_client, product)

    assert response.status_code == status.HTTP_201_CREATED
    image = response.json()["data"]
    assert (image["width"], image["height"], image["position"]) == (40, 30, 0)
    assert image["url"]
    detail = api_client.get(f"/api/v1/products/{product.id}/").json()["data"]
    assert [img["id"] for img in detail["images"]] == [image["id"]]


def test_upload_non_image_returns_400(admin_client, product_factory):
    fake = SimpleUploadedFile("x.png", b"definitely not an image", content_type="image/png")

    response = upload(admin_client, product_factory(), fake)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "image" in response.json()["error"]["details"]


def test_upload_over_size_limit_returns_400(admin_client, product_factory, settings):
    settings.MAX_IMAGE_UPLOAD_BYTES = 10

    response = upload(admin_client, product_factory())

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "image" in response.json()["error"]["details"]


def test_deleting_image_or_product_removes_files_from_storage(
    admin_client, product_factory, django_capture_on_commit_callbacks
):
    product = product_factory()
    first = upload(admin_client, product).json()["data"]
    upload(admin_client, product)
    first_name, second_name = ProductImage.objects.order_by("position").values_list("image", flat=True)

    with django_capture_on_commit_callbacks(execute=True):
        response = admin_client.delete(f"{images_url(product.id)}{first['id']}/")

    assert response.status_code == status.HTTP_200_OK
    assert not default_storage.exists(first_name)
    assert default_storage.exists(second_name)

    with django_capture_on_commit_callbacks(execute=True):
        admin_client.delete(f"/api/v1/products/{product.id}/")

    assert not default_storage.exists(second_name)


def test_listing_products_with_images_does_not_do_n_plus_1_queries(api_client, product_factory, settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}

    def add_product_with_image():
        ProductImage.objects.create(product=product_factory(), image=make_png(), position=0)

    def count_list_queries():
        with CaptureQueriesContext(connection) as ctx:
            assert api_client.get("/api/v1/products/").status_code == status.HTTP_200_OK
        return len(ctx.captured_queries)

    add_product_with_image()
    baseline = count_list_queries()
    for _ in range(3):
        add_product_with_image()

    assert count_list_queries() == baseline
