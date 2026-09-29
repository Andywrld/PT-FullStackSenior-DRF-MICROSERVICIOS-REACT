from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from products.models import Category, Product, ProductImage

# Demo data only: run by `make seed`, never by a migration.
SEED_IMAGES_DIR = Path(__file__).resolve().parents[3] / "seed_data" / "images"

SAMPLE_CATEGORIES = {
    "despensa": "Despensa",
    "lacteos-y-huevos": "Lácteos y Huevos",
    "carnes": "Carnes",
    "electrodomesticos": "Electrodomésticos",
}

SAMPLE_PRODUCTS = [
    {
        "sku": "DESP-0001",
        "name": "Aceite vegetal 5 L",
        "description": "Aceite vegetal comestible en bidón de 5 litros, ideal para cocinar y freír.",
        "price": Decimal("12.90"),
        "stock": 80,
        "category": "despensa",
        "images": ["aceite1.png"],
    },
    {
        "sku": "DESP-0002",
        "name": "Harina de trigo multiuso 1 kg",
        "description": "Harina de trigo para todo uso, en bolsa de 1 kg.",
        "price": Decimal("2.10"),
        "stock": 200,
        "category": "despensa",
        "images": ["bolsaarina1.png"],
    },
    {
        "sku": "DESP-0003",
        "name": "Harina de trigo panadera El Cedro (saco)",
        "description": "Harina de trigo de alta calidad para panificación, en saco.",
        "price": Decimal("38.00"),
        "stock": 40,
        "category": "despensa",
        "images": ["sacoarina1.png"],
    },
    {
        "sku": "DESP-0004",
        "name": "Harina de trigo Doma para pan, saco 45 kg",
        "description": "Harina de trigo para panificación, ideal para pan francés. Saco de 45 kg.",
        "price": Decimal("36.50"),
        "stock": 35,
        "category": "despensa",
        "images": ["sacoarina2.png"],
    },
    {
        "sku": "DESP-0005",
        "name": "Arroz blanco de grano largo (saco)",
        "description": "Arroz blanco de grano largo, en saco de yute.",
        "price": Decimal("24.00"),
        "stock": 50,
        "category": "despensa",
        "images": ["sacoarroz1.png", "sacoarroz1.1.png"],
    },
    {
        "sku": "LACT-0001",
        "name": "Leche entera 1 L",
        "description": "Leche entera en caja de 1 litro.",
        "price": Decimal("1.20"),
        "stock": 300,
        "category": "lacteos-y-huevos",
        "images": ["leche1.png"],
    },
    {
        "sku": "LACT-0002",
        "name": "Huevos de granja (12 unidades)",
        "description": "Huevos frescos de granja, docena.",
        "price": Decimal("3.50"),
        "stock": 150,
        "category": "lacteos-y-huevos",
        "images": ["huevo1.png"],
    },
    {
        "sku": "CARN-0001",
        "name": "Lomo de cerdo (por kg)",
        "description": "Lomo de cerdo fresco, precio por kilogramo.",
        "price": Decimal("8.90"),
        "stock": 60,
        "category": "carnes",
        "images": ["lomocarne1.png", "lomocarne1.1.png", "lomocarne1.2.png"],
    },
    {
        "sku": "ELDO-0001",
        "name": "Cocina de inducción RAF",
        "description": "Cocina de inducción de una hornilla con panel de control táctil.",
        "price": Decimal("55.00"),
        "stock": 25,
        "category": "electrodomesticos",
        "images": ["fogoninduccion1.png"],
    },
    {
        "sku": "ELDO-0002",
        "name": "Cocina de inducción de vidrio templado",
        "description": "Cocina de inducción de una hornilla con superficie de vidrio templado y encendido táctil.",
        "price": Decimal("40.00"),
        "stock": 30,
        "category": "electrodomesticos",
        "images": ["fogoninduccion2.png"],
    },
    {
        "sku": "ELDO-0003",
        "name": "Lavadora automática Electrolux 12 kg",
        "description": "Lavadora automática de carga superior con capacidad de 12 kg y panel digital.",
        "price": Decimal("319.00"),
        "stock": 12,
        "category": "electrodomesticos",
        "images": ["lavadora1.png"],
    },
    {
        "sku": "ELDO-0004",
        "name": "Lavadora de carga frontal",
        "description": "Lavadora de carga frontal para el uso diario del hogar.",
        "price": Decimal("429.00"),
        "stock": 10,
        "category": "electrodomesticos",
        "images": ["lavadora2.png"],
    },
    {
        "sku": "ELDO-0005",
        "name": "Lavadora de carga frontal Inverter",
        "description": "Lavadora de carga frontal con motor Inverter, eficiente y silenciosa.",
        "price": Decimal("499.00"),
        "stock": 8,
        "category": "electrodomesticos",
        "images": ["lavadora3.png"],
    },
]


class Command(BaseCommand):
    help = (
        "Seed demo categories (by slug) and products (by SKU) with their photos from "
        "seed_data/images. Idempotent: photos are attached only to products that have none."
    )

    def handle(self, *args, **options):
        missing = [
            name for data in SAMPLE_PRODUCTS for name in data["images"] if not (SEED_IMAGES_DIR / name).is_file()
        ]
        if missing:
            raise CommandError(f"Missing seed images in {SEED_IMAGES_DIR}: {', '.join(missing)}")

        categories = {
            slug: Category.objects.update_or_create(slug=slug, defaults={"name": name})[0]
            for slug, name in SAMPLE_CATEGORIES.items()
        }
        created_count = updated_count = images_count = 0
        for data in SAMPLE_PRODUCTS:
            defaults = {
                "name": data["name"],
                "description": data["description"],
                "price": data["price"],
                "stock": data["stock"],
                "category": categories[data["category"]],
            }
            product, created = Product.objects.update_or_create(sku=data["sku"], defaults=defaults)
            if created:
                created_count += 1
            else:
                updated_count += 1
            if not product.images.exists():
                for position, file_name in enumerate(data["images"]):
                    with (SEED_IMAGES_DIR / file_name).open("rb") as handle:
                        ProductImage.objects.create(
                            product=product, image=File(handle, name=file_name), position=position
                        )
                    images_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {len(categories)} categories, {created_count} products created, "
                f"{updated_count} updated, {images_count} images added."
            )
        )
