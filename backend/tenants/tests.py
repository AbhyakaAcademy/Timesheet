from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from tenants.models import TenantOrganization, TenantSubscription

User = get_user_model()


class TenantApiTests(APITestCase):
    def setUp(self):
        self.organization = TenantOrganization.objects.create(name="Acme Corporation", slug="acme-corporation")
        TenantSubscription.objects.create(
            organization=self.organization,
            plan_name="Enterprise",
            licenses=50,
            monthly_recurring_revenue=Decimal("649.00"),
        )
        self.tenant_user = User.objects.create_user(
            username="tenant-test",
            password="Pass@12345",
            role="tenant",
            organization=self.organization,
        )
        self.admin_user = User.objects.create_user(
            username="admin-test",
            password="Pass@12345",
            role="admin",
        )

    def test_tenant_can_create_department(self):
        self.client.force_authenticate(self.tenant_user)
        response = self.client.post(reverse("tenant_departments"), {"name": "Engineering", "status": "Active"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Engineering")

    def test_admin_can_view_clients(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin_clients"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
