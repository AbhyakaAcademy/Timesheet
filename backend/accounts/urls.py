from django.urls import path

from accounts.views import (
    AcceptInvitationView,
    ApiStatusView,
    ForgotPasswordView,
    LoginView,
    MeView,
    ResendVerificationEmailView,
    ResetPasswordView,
    SignupView,
    VerifyEmailView,
)

urlpatterns = [
    path("health/", ApiStatusView.as_view(), name="api_health"),
    path("auth/login", LoginView.as_view(), name="auth_login"),
    path("auth/forgot-password", ForgotPasswordView.as_view(), name="auth_forgot_password"),
    path("auth/reset-password", ResetPasswordView.as_view(), name="auth_reset_password"),
    path("auth/signup", SignupView.as_view(), name="auth_signup"),
    path("auth/accept-invite", AcceptInvitationView.as_view(), name="auth_accept_invite"),
    path("auth/resend-verification", ResendVerificationEmailView.as_view(), name="auth_resend_verification"),
    path("auth/verify-email", VerifyEmailView.as_view(), name="auth_verify_email"),
    path("me/", MeView.as_view(), name="me"),
]
