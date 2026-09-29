from django.conf import settings
from django.core.management.base import BaseCommand

from accounts.models import User, normalize_email


class Command(BaseCommand):
    help = (
        "Create the bootstrap super admin from SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD. "
        "Idempotent: an existing account keeps its password and gets the super_admin role."
    )

    def handle(self, *args, **options):
        email = normalize_email(settings.SUPERADMIN_EMAIL)
        if not email or not settings.SUPERADMIN_PASSWORD:
            self.stdout.write("SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD not set; skipping.")
            return
        user = User.objects.filter(email=email).first()
        if user is None:
            User.objects.create_user(
                email, settings.SUPERADMIN_PASSWORD, role=User.Role.SUPER_ADMIN, full_name="Super Admin"
            )
            self.stdout.write(self.style.SUCCESS(f"Super admin {email} created."))
        elif user.role != User.Role.SUPER_ADMIN:
            user.role = User.Role.SUPER_ADMIN
            user.save(update_fields=["role"])
            self.stdout.write(self.style.SUCCESS(f"{email} promoted to super admin."))
        else:
            self.stdout.write(f"Super admin {email} already exists.")
