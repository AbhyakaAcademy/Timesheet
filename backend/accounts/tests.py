from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import TenantSignupRequest, User, UserRole
from accounts.services import create_or_refresh_tenant_signup_request
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
