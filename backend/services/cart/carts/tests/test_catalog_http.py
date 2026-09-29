import uuid
from types import SimpleNamespace

import pytest
import requests

from carts.catalog import CatalogUnavailableError
from carts.catalog_http import HttpProductCatalog


class FakeSession:
    """Records GET calls; returns a canned response or raises a canned error."""

    def __init__(self, outcome):
        self.outcome = outcome
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append(SimpleNamespace(url=url, **kwargs))
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


def fake_response(status_code, payload=None):
    return SimpleNamespace(status_code=status_code, json=lambda: payload)


@pytest.mark.parametrize(
    "outcome",
    [requests.ConnectionError("connection refused"), fake_response(503)],
    ids=["network-error", "server-error"],
)
def test_network_errors_and_server_errors_raise_catalog_unavailable(outcome):
    catalog = HttpProductCatalog(session=FakeSession(outcome), base_url="http://products:8000")

    with pytest.raises(CatalogUnavailableError):
        catalog.get_products([uuid.uuid4()])
