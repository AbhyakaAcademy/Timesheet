from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from notifications.models import Notification
from tenants.models import TenantOrganization, TenantPolicy, TenantSubscription

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
        self.employee_user = User.objects.create_user(
            username="employee-test",
            password="Pass@12345",
            role="employee",
            organization=self.organization,
        )

    def test_tenant_can_create_department(self):
        self.client.force_authenticate(self.tenant_user)
        response = self.client.post(reverse("tenant_departments"), {"name": "Legal", "status": "Active"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Legal")

    def test_admin_can_view_clients(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin_clients"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    @override_settings(
        DEBUG=True,
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
    )
    def test_tenant_can_invite_employee_user(self):
        self.client.force_authenticate(self.tenant_user)
        response = self.client.post(
            reverse("tenant_users"),
            {
                "name": "Invite Employee",
                "email": "invite-employee@example.com",
                "role": "employee",
                "status": "Active",
                "department": "Engineering",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email"], "invite-employee@example.com")
        self.assertTrue(response.data["invitation_pending"])
        self.assertIn("invitation_url", response.data)

    def test_employee_can_view_active_policies(self):
        active_policy = TenantPolicy.objects.create(
            organization=self.organization,
            title="Attendance Policy",
            description="Follow standard attendance rules.",
            applies_to="All employees",
            enabled=True,
            details=["Check in daily."],
        )
        TenantPolicy.objects.create(
            organization=self.organization,
            title="Archived Policy",
            description="Should stay hidden.",
            applies_to="All employees",
            enabled=False,
            details=["Old rule."],
        )

        self.client.force_authenticate(self.employee_user)
        response = self.client.get(reverse("employee_policies"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], active_policy.id)
        self.assertEqual(response.data[0]["title"], "Attendance Policy")

    def test_policy_update_notifies_active_org_users(self):
        policy = TenantPolicy.objects.create(
            organization=self.organization,
            title="Attendance Policy",
            description="Original description.",
            applies_to="All employees",
            enabled=True,
            details=["Check in daily."],
        )

        self.client.force_authenticate(self.tenant_user)
        response = self.client.patch(
            reverse("tenant_policy_detail", kwargs={"policy_id": policy.id}),
            {"description": "Updated description."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Notification.objects.filter(recipient=self.tenant_user, title="Policy update").count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.employee_user, title="Policy update").count(), 1)
