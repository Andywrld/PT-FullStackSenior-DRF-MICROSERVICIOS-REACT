.PHONY: up down build logs test test-auth test-products test-cart test-orders migrate seed psql-auth psql-products psql-cart psql-orders clean

up:
	docker compose up -d --build --wait

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test: test-auth test-products test-cart test-orders

test-auth:
	docker compose --profile test run --rm auth-tests

test-products:
	docker compose --profile test run --rm products-tests

test-cart:
	docker compose --profile test run --rm cart-tests

test-orders:
	docker compose --profile test run --rm orders-tests

migrate:
	docker compose run --rm auth-migrate
	docker compose run --rm products-migrate
	docker compose run --rm cart-migrate
	docker compose run --rm orders-migrate

seed:
	docker compose exec products python manage.py seed_products

psql-auth:
	docker compose exec auth-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

psql-products:
	docker compose exec products-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

psql-cart:
	docker compose exec cart-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

psql-orders:
	docker compose exec orders-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

clean:
	docker compose down -v
