from django.urls import path

from accounts.views import ApiStatusView, LoginView, MeView, SignupView, VerifyEmailView

urlpatterns = [
    path("health/", ApiStatusView.as_view(), name="api_health"),
    path("auth/login", LoginView.as_view(), name="auth_login"),
    path("auth/signup", SignupView.as_view(), name="auth_signup"),
    path("auth/verify-email", VerifyEmailView.as_view(), name="auth_verify_email"),
    path("me/", MeView.as_view(), name="me"),
]
