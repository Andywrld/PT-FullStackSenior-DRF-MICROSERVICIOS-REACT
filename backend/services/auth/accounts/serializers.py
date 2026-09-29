from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User, normalize_email
from .tokens import revoke_all_refresh_tokens


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "is_active", "date_joined"]
        read_only_fields = fields


def validate_unique_email(value):
    email = normalize_email(value)
    if User.objects.filter(email=email).exists():
        raise serializers.ValidationError("Ya existe una cuenta con este email.")
    return email


def validate_new_password(password, user):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError({"password": list(exc.messages)}) from exc


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        return validate_unique_email(value)

    def validate(self, attrs):
        validate_new_password(attrs["password"], User(email=attrs["email"], full_name=attrs["full_name"]))
        return attrs

    def create(self, validated_data):
        # Public sign-up always creates a regular user; roles are granted by a super admin.
        return User.objects.create_user(role=User.Role.USER, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_type = serializers.CharField()
    expires_in = serializers.IntegerField(help_text="Access token lifetime in seconds.")


class LoginResponseSerializer(TokenPairSerializer):
    user = UserSerializer()


class UserAdminCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.USER)
    is_active = serializers.BooleanField(default=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return validate_unique_email(value)

    def validate(self, attrs):
        validate_new_password(attrs["password"], User(email=attrs["email"], full_name=attrs["full_name"]))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["full_name", "role", "is_active", "password"]

    def validate(self, attrs):
        user = self.instance
        changes_access = attrs.get("role", user.role) != user.role or attrs.get("is_active", user.is_active) != user.is_active
        # Keeps the last super admin from locking everyone out by accident.
        if user.id == self.context["request"].user.id and changes_access:
            raise serializers.ValidationError("No puedes cambiar tu propio rol ni tu estado.")
        if attrs.get("password"):
            validate_new_password(attrs["password"], user)
        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        was_active = instance.is_active
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        # A new password or a deactivation ends every open session right away.
        if password or (was_active and not user.is_active):
            revoke_all_refresh_tokens(user)
        return user
