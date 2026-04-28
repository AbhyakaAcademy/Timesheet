from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import PasswordResetRequest, TenantSignupRequest, User, UserInvitation


class MeSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "organization", "organization_name")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login_value = attrs["username"].strip()
        password = attrs["password"]

        user = authenticate(username=login_value, password=password)
        if not user and "@" in login_value:
            matched_user = User.objects.filter(email__iexact=login_value).first()
            if matched_user:
                user = authenticate(username=matched_user.username, password=password)

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


class ResendVerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized = value.strip().lower()
        pending = TenantSignupRequest.objects.filter(email__iexact=normalized, verified_user__isnull=True).first()
        if not pending:
            raise serializers.ValidationError("No pending verification request was found for this email.")
        return normalized


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_token(self, value):
        token = value.strip()
        if not token:
            raise serializers.ValidationError("Invitation token is required.")
        return token

    def validate_password(self, value):
        if any(ch.isspace() for ch in value):
            raise serializers.ValidationError("Password cannot contain spaces.")
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class InvitationStatusSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    organization_name = serializers.CharField(source="user.organization.name", read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserInvitation
        fields = ("email", "role", "organization_name", "name", "token_expires_at", "accepted_at")

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized = value.strip().lower()
        user = User.objects.filter(email__iexact=normalized).first()
        if not user:
            raise serializers.ValidationError("No account was found for this email.")
        return normalized


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_token(self, value):
        token = value.strip()
        if not token:
            raise serializers.ValidationError("Reset token is required.")
        return token

    def validate_password(self, value):
        if any(ch.isspace() for ch in value):
            raise serializers.ValidationError("Password cannot contain spaces.")
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class PasswordResetStatusSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = PasswordResetRequest
        fields = ("email", "token_expires_at", "used_at")
