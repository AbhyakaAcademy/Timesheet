from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from notifications.models import Notification
from tenants.models import TenantOrganization
from timesheets.models import ManualEntryRequest, ManualEntryRequestStatus, Project, TeamMembership, TimeEntry, TimeEntrySource, Timesheet, TimesheetLine
from timesheets.views import week_start_for


class ManagerEmployeeNotificationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.organization = TenantOrganization.objects.create(name="Manager Org", slug="manager-org")
        self.employee = User.objects.create_user(
            username="employee1",
            password="Pass@12345",
            role="employee",
            first_name="Employee",
            last_name="One",
            organization=self.organization,
        )
        self.manager = User.objects.create_user(
            username="manager1",
            password="Pass@12345",
            role="manager",
            organization=self.organization,
        )
        TeamMembership.objects.create(manager=self.manager, employee=self.employee)
        self.project = Project.objects.create(name="Project Alpha", code="ALPHA")
        self.client.force_authenticate(self.employee)

    def test_punch_in_notifies_manager(self):
        response = self.client.post(
            reverse("punch_in"),
            {"project_id": self.project.id, "note": "Starting work"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="Employee punched in",
                message__contains="Employee One punched in for Project Alpha",
            ).exists()
        )

    def test_punch_out_notifies_manager(self):
        entry = TimeEntry.objects.create(
            employee=self.employee,
            project=self.project,
            source=TimeEntrySource.PUNCH,
            start_time=timezone.now() - timedelta(hours=1),
        )

        response = self.client.post(
            reverse("punch_out", args=[entry.id]),
            {"note": "Done"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="Employee punched out",
                message__contains="Employee One punched out from Project Alpha",
            ).exists()
        )

    def test_employee_manual_entry_request_notifies_manager(self):
        response = self.client.post(
            reverse("employee_manual_entry_requests"),
            {
                "request_type": "Punch in not working",
                "request_date": timezone.localdate().isoformat(),
                "comment": "Project: Project Alpha (PA)\nStart: Apr 29, 2026, 9:00 AM\nEnd: Apr 29, 2026, 5:00 PM\nEmployee details: Scanner was offline.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="Manual entry request submitted",
                message__contains="Employee One submitted a punch in not working request",
            ).exists()
        )

    def test_employee_cannot_create_manual_entry_directly(self):
        response = self.client.post(
            reverse("manual_time_entry"),
            {
                "employee_id": self.employee.id,
                "project_id": self.project.id,
                "start_time": (timezone.now() - timedelta(hours=2)).isoformat(),
                "end_time": timezone.now().isoformat(),
                "note": "Manual work",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_manager_can_approve_manual_entry_request_and_create_time_entry(self):
        manual_request = ManualEntryRequest.objects.create(
            employee=self.employee,
            request_type="MISSED_BOTH",
            request_date=timezone.localdate(),
            comment="Laptop battery died and I missed both punches.",
        )

        self.client.force_authenticate(self.manager)
        start_time = timezone.now() - timedelta(hours=2)
        end_time = timezone.now() - timedelta(hours=1)
        response = self.client.post(
            reverse("manager_manual_entry_request_approve", args=[manual_request.id]),
            {
                "project_id": self.project.id,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "note": "Approved manager backfill",
                "manager_comment": "Approved after reviewing context.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        manual_request.refresh_from_db()
        self.assertEqual(manual_request.status, ManualEntryRequestStatus.APPROVED)
        self.assertIsNotNone(manual_request.approved_entry)
        self.assertTrue(
            TimeEntry.objects.filter(
                employee=self.employee,
                project=self.project,
                source=TimeEntrySource.MANUAL,
                note="Approved manager backfill",
            ).exists()
        )
        self.assertTrue(
            TimesheetLine.objects.filter(
                timesheet__employee=self.employee,
                project=self.project,
                time_entry=manual_request.approved_entry,
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.employee,
                title="Manual entry request approved",
            ).exists()
        )

    def test_timesheet_line_changes_notify_manager(self):
        timesheet = Timesheet.objects.create(
            employee=self.employee,
            week_start=week_start_for(timezone.now()),
        )

        add_response = self.client.post(
            reverse("add_timesheet_line", args=[timesheet.id]),
            {
                "date": timesheet.week_start.isoformat(),
                "project_id": self.project.id,
                "description": "Work",
                "hours": "2.50",
                "shift": "DAY",
            },
            format="json",
        )
        self.assertEqual(add_response.status_code, 201)
        line_id = add_response.data["id"]

        patch_response = self.client.patch(
            reverse("timesheet_line_detail", args=[line_id]),
            {"hours": "3.00"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)

        delete_response = self.client.delete(reverse("timesheet_line_detail", args=[line_id]))
        self.assertEqual(delete_response.status_code, 204)

        self.assertTrue(Notification.objects.filter(recipient=self.manager, title="Timesheet entry added").exists())
        self.assertTrue(Notification.objects.filter(recipient=self.manager, title="Timesheet entry updated").exists())
        self.assertTrue(Notification.objects.filter(recipient=self.manager, title="Timesheet entry deleted").exists())

    def test_timesheet_submit_notifies_manager_with_employee_name(self):
        timesheet = Timesheet.objects.create(
            employee=self.employee,
            week_start=week_start_for(timezone.now()),
        )
        TimesheetLine.objects.create(
            timesheet=timesheet,
            date=timesheet.week_start,
            project=self.project,
            description="Ready to submit",
            hours=Decimal("1.00"),
        )

        response = self.client.post(reverse("submit_timesheet", args=[timesheet.id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="Timesheet submitted",
                message__contains="Employee One submitted timesheet",
            ).exists()
        )

    def test_add_timesheet_line_with_same_time_entry_updates_instead_of_duplicates(self):
        timesheet = Timesheet.objects.create(
            employee=self.employee,
            week_start=week_start_for(timezone.now()),
        )
        entry = TimeEntry.objects.create(
            employee=self.employee,
            project=self.project,
            source=TimeEntrySource.PUNCH,
            start_time=timezone.now() - timedelta(minutes=20),
            end_time=timezone.now(),
            duration_minutes=20,
        )

        first_response = self.client.post(
            reverse("add_timesheet_line", args=[timesheet.id]),
            {
                "date": timesheet.week_start.isoformat(),
                "project_id": self.project.id,
                "description": "Punch entry",
                "hours": "0.33",
                "shift": "DAY",
                "time_entry_id": entry.id,
            },
            format="json",
        )
        self.assertEqual(first_response.status_code, 201)

        second_response = self.client.post(
            reverse("add_timesheet_line", args=[timesheet.id]),
            {
                "date": timesheet.week_start.isoformat(),
                "project_id": self.project.id,
                "description": "Updated punch entry",
                "hours": "0.50",
                "shift": "DAY",
                "time_entry_id": entry.id,
            },
            format="json",
        )

        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(
            TimesheetLine.objects.filter(timesheet__employee=self.employee, time_entry=entry).count(),
            1,
        )
        line = TimesheetLine.objects.get(timesheet__employee=self.employee, time_entry=entry)
        self.assertEqual(line.description, "Updated punch entry")
        self.assertEqual(line.hours, Decimal("0.50"))

    @override_settings(
        DEBUG=True,
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
        DEFAULT_FROM_EMAIL="webmaster@localhost",
    )
    def test_manager_can_invite_employee(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            reverse("manager_employees"),
            {
                "name": "Invited Employee",
                "email": "manager-invite@example.com",
                "department": "Operations",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email"], "manager-invite@example.com")
        self.assertTrue(response.data["invitation_pending"])
        self.assertIn("invitation_url", response.data)
