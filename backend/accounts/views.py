from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TenantSignupRequest
from accounts.serializers import LoginSerializer, MeSerializer, SignupSerializer, VerifyEmailSerializer
from accounts.services import (
    create_or_refresh_tenant_signup_request,
    create_tenant_user_from_signup_request,
    hash_token,
    send_signup_verification_email,
)


class ApiStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "timesheet-api"})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        signup_request = None
        try:
            signup_request, token = create_or_refresh_tenant_signup_request(
                email=data["email"],
                password=data["password"],
                organization_name=data["organization_name"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
            )
            send_signup_verification_email(
                email=signup_request.email,
                organization_name=signup_request.organization_name,
                token=token,
            )
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": "Verification email sent. Please check your inbox to activate the account.",
                "email": signup_request.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_hash = hash_token(serializer.validated_data["token"])

        signup_request = TenantSignupRequest.objects.filter(
            verification_token_hash=token_hash,
            verified_user__isnull=True,
        ).first()
        if not signup_request:
            return Response({"detail": "Verification link is invalid or has already been used."}, status=status.HTTP_400_BAD_REQUEST)

        if signup_request.token_expires_at < timezone.now():
            return Response({"detail": "Verification link has expired. Please sign up again."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = create_tenant_user_from_signup_request(signup_request)
            signup_request.verified_user = user
            signup_request.verified_at = timezone.now()
            signup_request.save(update_fields=["verified_user", "verified_at", "updated_at"])

        return Response(
            {
                "message": "Email verified successfully. Your tenant account is now active.",
                "user": MeSerializer(user).data,
            }
        )
