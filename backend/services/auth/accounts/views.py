from django.contrib.auth import authenticate
from django.db import connection
from drf_spectacular.utils import extend_schema
from marketplace_common.errors import DomainError
from marketplace_common.permissions import IsSuperAdmin
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from . import keys, tokens
from .models import User
from .serializers import (
    LoginResponseSerializer,
    LoginSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserAdminCreateSerializer,
    UserAdminUpdateSerializer,
    UserSerializer,
)


class InvalidCredentialsError(DomainError):
    status_code = 401
    code = "invalid_credentials"
    # Same message for unknown email and wrong password: no account enumeration.
    default_message = "Invalid email or password."


class PublicAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class RegisterView(PublicAPIView):
    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(PublicAPIView):
    @extend_schema(request=LoginSerializer, responses=LoginResponseSerializer)
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # ModelBackend hashes a dummy password for unknown emails, so response
        # time doesn't reveal whether the account exists. Inactive users fail too.
        user = authenticate(
            request,
            email=serializer.validated_data["email"].strip().lower(),
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise InvalidCredentialsError()
        return Response({**tokens.issue_token_pair(user), "user": UserSerializer(user).data})


class RefreshView(PublicAPIView):
    @extend_schema(request=RefreshTokenSerializer, responses=TokenPairSerializer)
    def post(self, request, *args, **kwargs):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _, pair = tokens.rotate_refresh_token(serializer.validated_data["refresh_token"])
        return Response(pair)


class LogoutView(PublicAPIView):

    @extend_schema(request=RefreshTokenSerializer, responses={200: None})
    def post(self, request, *args, **kwargs):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens.revoke_refresh_token(serializer.validated_data["refresh_token"])
        return Response(None)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request, *args, **kwargs):
        user = User.objects.get(pk=request.user.id)
        return Response(UserSerializer(user).data)


class UserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """User management, super admin only. Filters: `?search=`, `?role=`, `?is_active=`."""

    permission_classes = [IsSuperAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    lookup_field = "id"
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["email", "full_name"]
    ordering_fields = ["date_joined", "email", "full_name"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        queryset = User.objects.all()
        params = self.request.query_params
        if params.get("role"):
            queryset = queryset.filter(role=params["role"])
        if params.get("is_active") in ("true", "false"):
            queryset = queryset.filter(is_active=params["is_active"] == "true")
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return UserAdminCreateSerializer
        return UserAdminUpdateSerializer if self.action == "partial_update" else UserSerializer

    @extend_schema(request=UserAdminCreateSerializer, responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = UserAdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(UserSerializer(serializer.save()).data, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: None})
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            raise ValidationError("No puedes eliminar tu propia cuenta.")
        user.delete()
        return Response(None, status=status.HTTP_200_OK)

    @extend_schema(request=UserAdminUpdateSerializer, responses=UserSerializer)
    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = UserAdminUpdateSerializer(user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)


@extend_schema(exclude=True)
class JWKSView(PublicAPIView):
    """Public signing keys in the standard JWKS format (RFC 7517). Deliberately
    NOT wrapped in the envelope: JWKS clients expect exactly {"keys": [...]}."""

    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        return Response(keys.jwks(), headers={"Cache-Control": "public, max-age=300"})


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class HealthView(PublicAPIView):
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            return Response({"status": "error"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"status": "ok"})
