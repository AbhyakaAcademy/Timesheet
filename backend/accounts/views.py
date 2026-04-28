from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TenantSignupRequest
from accounts.serializers import (
    AcceptInvitationSerializer,
    ForgotPasswordSerializer,
    InvitationStatusSerializer,
    LoginSerializer,
    MeSerializer,
    PasswordResetStatusSerializer,
    ResendVerificationEmailSerializer,
    ResetPasswordSerializer,
    SignupSerializer,
    VerifyEmailSerializer,
)
from accounts.services import (
    create_or_refresh_tenant_signup_request,
    create_tenant_user_from_signup_request,
    hash_token,
    refresh_signup_verification_token,
    send_password_reset_email,
    send_signup_verification_email,
)
from rest_framework_simplejwt.tokens import RefreshToken


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
            delivery = send_signup_verification_email(
                email=signup_request.email,
                organization_name=signup_request.organization_name,
                token=token,
            )
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        response_payload = {
            "message": "Verification email sent. Please check your inbox to activate the account.",
            "email": signup_request.email,
        }
        if delivery and delivery.get("delivery_mode") == "development":
            response_payload["message"] = "Email is not configured locally, so use the verification link below to activate the account."
            response_payload["verification_url"] = delivery.get("verification_url")

        return Response(response_payload, status=status.HTTP_201_CREATED)


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


class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        signup_request = TenantSignupRequest.objects.filter(
            email__iexact=email,
            verified_user__isnull=True,
        ).first()
        if not signup_request:
            return Response({"detail": "No pending verification request was found for this email."}, status=status.HTTP_400_BAD_REQUEST)

        token = refresh_signup_verification_token(signup_request)

        try:
            delivery = send_signup_verification_email(
                email=signup_request.email,
                organization_name=signup_request.organization_name,
                token=token,
            )
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        response_payload = {
            "message": "A new verification email has been sent.",
            "email": signup_request.email,
        }
        if delivery and delivery.get("delivery_mode") == "development":
            response_payload["message"] = "Email is not configured locally, so use the verification link below to activate the account."
            response_payload["verification_url"] = delivery.get("verification_url")

        return Response(response_payload, status=status.HTTP_200_OK)


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_hash = hash_token(serializer.validated_data["token"])

        from accounts.models import UserInvitation

        invitation = UserInvitation.objects.select_related("user", "user__organization").filter(
            invitation_token_hash=token_hash,
            accepted_at__isnull=True,
        ).first()
        if not invitation:
            return Response({"detail": "Invitation link is invalid or has already been used."}, status=status.HTTP_400_BAD_REQUEST)

        if invitation.token_expires_at < timezone.now():
            return Response({"detail": "Invitation link has expired. Ask your tenant admin to send a new invite."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = invitation.user
            user.set_password(serializer.validated_data["password"])
            user.is_active = True
            user.save(update_fields=["password", "is_active"])

            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["accepted_at", "updated_at"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Invitation accepted successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": MeSerializer(user).data,
            }
        )

    def get(self, request):
        token = request.query_params.get("token", "").strip()
        if not token:
            return Response({"detail": "Invitation token is required."}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.models import UserInvitation

        invitation = UserInvitation.objects.select_related("user", "user__organization").filter(
            invitation_token_hash=hash_token(token)
        ).first()
        if not invitation or invitation.accepted_at:
            return Response({"detail": "Invitation link is invalid or has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.token_expires_at < timezone.now():
            return Response({"detail": "Invitation link has expired. Ask your tenant admin to send a new invite."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InvitationStatusSerializer(invitation).data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        from accounts.models import User

        user = User.objects.filter(email__iexact=email).first()
        try:
            delivery = send_password_reset_email(user=user)
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        response_payload = {
            "message": "Password reset email sent.",
            "email": user.email,
        }
        if delivery and delivery.get("delivery_mode") == "development":
            response_payload["message"] = "Email is not configured locally, so use the reset link below."
            response_payload["reset_url"] = delivery.get("reset_url")
        return Response(response_payload, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token", "").strip()
        if not token:
            return Response({"detail": "Reset token is required."}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.models import PasswordResetRequest

        reset_request = PasswordResetRequest.objects.select_related("user").filter(
            reset_token_hash=hash_token(token)
        ).first()
        if not reset_request or reset_request.used_at:
            return Response({"detail": "Reset link is invalid or has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if reset_request.token_expires_at < timezone.now():
            return Response({"detail": "Reset link has expired. Request a new one."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PasswordResetStatusSerializer(reset_request).data)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from accounts.models import PasswordResetRequest

        reset_request = PasswordResetRequest.objects.select_related("user").filter(
            reset_token_hash=hash_token(serializer.validated_data["token"]),
            used_at__isnull=True,
        ).first()
        if not reset_request:
            return Response({"detail": "Reset link is invalid or has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if reset_request.token_expires_at < timezone.now():
            return Response({"detail": "Reset link has expired. Request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user = reset_request.user
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        reset_request.used_at = timezone.now()
        reset_request.save(update_fields=["used_at", "updated_at"])

        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
