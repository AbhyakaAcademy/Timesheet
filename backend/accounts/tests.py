from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import PasswordResetRequest, TenantSignupRequest, User, UserInvitation, UserRole
from accounts.services import create_or_refresh_tenant_signup_request, generate_password_reset_request, generate_user_invitation
from tenants.models import TenantOrganization


class TenantSignupFlowTests(APITestCase):
    def test_signup_creates_pending_request(self):
        payload = {
            "email": "tenant@example.com",
            "password": "StrongPass!23",
            "confirm_password": "StrongPass!23",
            "organization_name": "Tenant Co",
        }

        with patch("accounts.views.send_signup_verification_email") as mocked_send:
            response = self.client.post(reverse("auth_signup"), payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertTrue(TenantSignupRequest.objects.filter(email="tenant@example.com").exists())
        mocked_send.assert_called_once()

    @override_settings(
        DEBUG=True,
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
    )
    def test_signup_returns_verification_url_when_email_is_not_configured_in_debug(self):
        payload = {
            "email": "tenant-debug@example.com",
            "password": "StrongPass!23",
            "confirm_password": "StrongPass!23",
            "organization_name": "Tenant Debug",
        }

        response = self.client.post(reverse("auth_signup"), payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIn("verification_url", response.data)
        self.assertIn("/verify-email?token=", response.data["verification_url"])

    def test_verify_email_creates_tenant_user_and_organization(self):
        signup_request, token = create_or_refresh_tenant_signup_request(
            email="tenant2@example.com",
            password="StrongPass!23",
            organization_name="Tenant Two",
            first_name="Tenant",
            last_name="Owner",
        )

        response = self.client.post(reverse("auth_verify_email"), {"token": token}, format="json")

        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email="tenant2@example.com")
        self.assertEqual(user.role, UserRole.TENANT)
        self.assertTrue(user.is_active)
        self.assertEqual(user.organization.name, "Tenant Two")
        self.assertTrue(TenantOrganization.objects.filter(name="Tenant Two").exists())

        signup_request.refresh_from_db()
        self.assertIsNotNone(signup_request.verified_at)
        self.assertEqual(signup_request.verified_user, user)

    def test_login_accepts_email_for_verified_tenant_user(self):
        signup_request, token = create_or_refresh_tenant_signup_request(
            email="tenant-login@example.com",
            password="StrongPass!23",
            organization_name="Tenant Login",
        )
        self.client.post(reverse("auth_verify_email"), {"token": token}, format="json")

        response = self.client.post(
            reverse("auth_login"),
            {"username": "tenant-login@example.com", "password": "StrongPass!23"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], "tenant-login@example.com")
        self.assertEqual(response.data["user"]["role"], UserRole.TENANT)

    @override_settings(
        DEBUG=True,
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
    )
    def test_resend_verification_returns_fresh_link_for_pending_signup(self):
        create_or_refresh_tenant_signup_request(
            email="tenant3@example.com",
            password="StrongPass!23",
            organization_name="Tenant Three",
        )

        response = self.client.post(
            reverse("auth_resend_verification"),
            {"email": "tenant3@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("verification_url", response.data)
        self.assertIn("/verify-email?token=", response.data["verification_url"])

    def test_accept_invitation_activates_user_and_returns_tokens(self):
        organization = TenantOrganization.objects.create(name="Invite Org", contact_email="owner@invite.org")
        user = User.objects.create(
            username="invitee1",
            email="invitee@example.com",
            role=UserRole.EMPLOYEE,
            organization=organization,
            is_active=False,
        )
        invitation, token = generate_user_invitation(user)

        response = self.client.post(
            reverse("auth_accept_invite"),
            {"token": token, "password": "StrongPass!23", "confirm_password": "StrongPass!23"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        user.refresh_from_db()
        invitation.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertIsNotNone(invitation.accepted_at)

    @override_settings(
        DEBUG=True,
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
    )
    def test_forgot_password_returns_reset_url_when_email_not_configured(self):
        user = User.objects.create_user(
            username="forgot1",
            email="forgot@example.com",
            password="StrongPass!23",
            role=UserRole.EMPLOYEE,
        )

        response = self.client.post(
            reverse("auth_forgot_password"),
            {"email": user.email},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("reset_url", response.data)
        self.assertIn("/reset-password?token=", response.data["reset_url"])

    def test_reset_password_updates_user_password(self):
        user = User.objects.create_user(
            username="reset1",
            email="reset@example.com",
            password="OldPass!23",
            role=UserRole.EMPLOYEE,
        )
        reset_request, token = generate_password_reset_request(user)

        response = self.client.post(
            reverse("auth_reset_password"),
            {"token": token, "password": "NewPass!23", "confirm_password": "NewPass!23"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        reset_request.refresh_from_db()
        self.assertTrue(user.check_password("NewPass!23"))
        self.assertIsNotNone(reset_request.used_at)
