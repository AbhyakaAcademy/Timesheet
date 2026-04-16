from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from notifications.models import Notification
from timesheets.models import Project, TeamMembership, TimeEntry, TimeEntrySource, Timesheet, TimesheetLine
from timesheets.views import week_start_for


class ManagerEmployeeNotificationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.employee = User.objects.create_user(
            username="employee1",
            password="Pass@12345",
            role="employee",
            first_name="Employee",
            last_name="One",
        )
        self.manager = User.objects.create_user(
            username="manager1",
            password="Pass@12345",
            role="manager",
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

    def test_manual_time_entry_notifies_manager(self):
        response = self.client.post(
            reverse("manual_time_entry"),
            {
                "project_id": self.project.id,
                "start_time": (timezone.now() - timedelta(hours=2)).isoformat(),
                "end_time": timezone.now().isoformat(),
                "note": "Manual work",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                title="Manual time entry added",
                message__contains="Employee One added a manual time entry for Project Alpha",
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
