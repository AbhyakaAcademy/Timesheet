from django.urls import path

from accounts.views import ApiStatusView, LoginView, MeView

urlpatterns = [
    path("health/", ApiStatusView.as_view(), name="api_health"),
    path("auth/login", LoginView.as_view(), name="auth_login"),
    path("me/", MeView.as_view(), name="me"),
]
