from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from accounts.keys import generate_private_key_file


class Command(BaseCommand):
    help = "Create the RS256 JWT signing key if it does not exist yet. Idempotent."

    def handle(self, *args, **options):
        path = Path(settings.JWT_PRIVATE_KEY_PATH)
        if path.exists():
            self.stdout.write(f"Signing key already present at {path}.")
            return
        generate_private_key_file(path)
        self.stdout.write(self.style.SUCCESS(f"Signing key created at {path}."))
