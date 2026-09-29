# syntax=docker/dockerfile:1

FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Shared chassis on the import path (not pip-installed): editing it doesn't bust the deps layer.
COPY --from=common marketplace_common /opt/marketplace-common/marketplace_common
ENV PYTHONPATH=/opt/marketplace-common

COPY . .

FROM base AS dev

COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

RUN chown -R app:app /app

USER app

CMD ["pytest"]

FROM base AS runtime

RUN python manage.py collectstatic --noinput

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application"]
