import contextvars
import logging
import uuid

_request_id_ctx = contextvars.ContextVar("request_id", default="-")


def get_request_id():
    return _request_id_ctx.get()


class RequestIDMiddleware:
    header_name = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get(self.header_name) or str(uuid.uuid4())
        request.request_id = request_id
        token = _request_id_ctx.set(request_id)
        try:
            response = self.get_response(request)
        finally:
            _request_id_ctx.reset(token)
        response["X-Request-ID"] = request_id
        return response


class RequestIDLogFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True
