# Dependency-free on purpose: the auth class DRF loads at startup can import it without cycles.


class DomainError(Exception):
    """Subclasses set `status_code`, a stable `code` and optionally `field` (details become {field: [message]})."""

    status_code = 400
    code = "domain_error"
    field = None
    headers = None
    default_message = "The request could not be processed."

    def __init__(self, message=None):
        super().__init__(message or self.default_message)


class ServiceUnavailableError(DomainError):
    status_code = 503
    code = "service_unavailable"
    headers = {"Retry-After": "5"}
    default_message = "A required service is temporarily unavailable. Please try again."
