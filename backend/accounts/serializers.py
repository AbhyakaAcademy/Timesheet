from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import TenantSignupRequest, User


class MeSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "organization", "organization_name")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": MeSerializer(user).data,
        }


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    organization_name = serializers.CharField(max_length=140)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        pending = TenantSignupRequest.objects.filter(email__iexact=normalized, verified_user__isnull=True).first()
        if pending and pending.token_expires_at > timezone.now():
            raise serializers.ValidationError("A verification request already exists for this email.")
        return normalized

    def validate_password(self, value):
        if any(ch.isspace() for ch in value):
            raise serializers.ValidationError("Password cannot contain spaces.")
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if not attrs["organization_name"].strip():
            raise serializers.ValidationError({"organization_name": "Organization name is required."})
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        token = value.strip()
        if not token:
            raise serializers.ValidationError("Verification token is required.")
        return token
