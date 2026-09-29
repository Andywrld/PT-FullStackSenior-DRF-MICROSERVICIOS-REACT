import uuid
from types import SimpleNamespace

import pytest
import requests

from orders.cart_gateway import CartUnavailableError
from orders.cart_http import HttpCartGateway


class FakeSession:
    """Records request() calls; returns a canned response or raises a canned error."""

    def __init__(self, outcome):
        self.outcome = outcome
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append(SimpleNamespace(method=method, url=url, **kwargs))
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
def test_network_errors_and_server_errors_raise_cart_unavailable(outcome):
    gateway = HttpCartGateway(session=FakeSession(outcome), base_url="http://cart:8000")

    with pytest.raises(CartUnavailableError):
        gateway.get_cart(uuid.uuid4())
