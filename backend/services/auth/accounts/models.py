import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models
from django.db.models import Q
from marketplace_common.auth import ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_USER, ROLES


def normalize_email(email):
    # Lowercased so uniqueness and login are case-insensitive.
    return (email or "").strip().lower()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password, **extra_fields):
        user = self.model(email=normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    class Role(models.TextChoices):
        USER = ROLE_USER, "User"
        ADMIN = ROLE_ADMIN, "Admin"
        SUPER_ADMIN = ROLE_SUPER_ADMIN, "Super admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True, default="")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        ordering = ["-date_joined"]
        constraints = [
            models.CheckConstraint(condition=Q(role__in=ROLES), name="user_role_valid"),
        ]
        indexes = [models.Index(fields=["role"], name="user_role_idx")]

    def __str__(self):
        return f"{self.email} ({self.role})"


class RefreshToken(models.Model):

    jti = models.UUIDField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="refresh_tokens")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "revoked_at"], name="refresh_user_revoked_idx")]

    def __str__(self):
        return f"{self.jti} ({'revoked' if self.revoked_at else 'active'})"
