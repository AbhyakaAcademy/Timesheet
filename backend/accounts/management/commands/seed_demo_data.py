from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User, UserRole
from finance.models import BillingRate, Client, Invoice, OvertimeRule, Policy
from notifications.models import Notification
from timesheets.models import (
    ApprovalAction,
    Project,
    TeamMembership,
    TimeEntry,
    TimeEntrySource,
    Timesheet,
    TimesheetApproval,
    TimesheetLine,
    TimesheetStatus,
)


def week_start_for(dt):
    return (dt - timedelta(days=dt.weekday())).date()


class Command(BaseCommand):
    help = "Seed demo users and sample records for local testing."

    def handle(self, *args, **options):
        users = {}
        users["employee"] = self.create_user("employee1", "Pass@12345", UserRole.EMPLOYEE, "Employee", "One")
        users["manager"] = self.create_user("manager1", "Pass@12345", UserRole.MANAGER, "Manager", "One")
        users["admin"] = self.create_user("admin1", "Pass@12345", UserRole.ADMIN, "Admin", "One", is_staff=True)
        users["finance"] = self.create_user("finance1", "Pass@12345", UserRole.FINANCE, "Finance", "One")

        project_a, _ = Project.objects.get_or_create(
            code="PRJ-1001",
            defaults={"name": "Tenant Platform", "client_name": "Acme Corp"},
        )
        project_b, _ = Project.objects.get_or_create(
            code="PRJ-1002",
            defaults={"name": "Internal Ops", "client_name": "Internal"},
        )

        TeamMembership.objects.get_or_create(manager=users["manager"], employee=users["employee"])

        current_week = week_start_for(timezone.now())
        draft, _ = Timesheet.objects.get_or_create(
            employee=users["employee"],
            week_start=current_week,
            defaults={"status": TimesheetStatus.DRAFT},
        )
        TimesheetLine.objects.get_or_create(
            timesheet=draft,
            date=current_week,
            project=project_a,
            description="Feature implementation",
            hours=Decimal("8.00"),
            shift="DAY",
        )

        submitted_week = current_week - timedelta(days=7)
        submitted, _ = Timesheet.objects.get_or_create(
            employee=users["employee"],
            week_start=submitted_week,
            defaults={"status": TimesheetStatus.SUBMITTED, "submitted_at": timezone.now() - timedelta(days=2)},
        )
        TimesheetLine.objects.get_or_create(
            timesheet=submitted,
            date=submitted_week,
            project=project_b,
            description="Support work",
            hours=Decimal("7.50"),
            shift="DAY",
        )

        approved_week = current_week - timedelta(days=14)
        approved, _ = Timesheet.objects.get_or_create(
            employee=users["employee"],
            week_start=approved_week,
            defaults={"status": TimesheetStatus.APPROVED, "submitted_at": timezone.now() - timedelta(days=9)},
        )
        TimesheetLine.objects.get_or_create(
            timesheet=approved,
            date=approved_week,
            project=project_a,
            description="Code review",
            hours=Decimal("6.50"),
            shift="DAY",
        )
        TimesheetApproval.objects.get_or_create(
            timesheet=approved,
            manager=users["manager"],
            action=ApprovalAction.APPROVED,
            defaults={"comment": "Looks good"},
        )

        TimeEntry.objects.get_or_create(
            employee=users["employee"],
            project=project_a,
            source=TimeEntrySource.MANUAL,
            start_time=timezone.now() - timedelta(hours=3),
            end_time=timezone.now() - timedelta(hours=1),
            defaults={"duration_minutes": 120, "note": "Backfill entry"},
        )

        Notification.objects.get_or_create(
            recipient=users["employee"],
            title="Welcome",
            message="Your demo account is ready.",
        )
        Notification.objects.get_or_create(
            recipient=users["manager"],
            title="Review pending",
            message="You have submitted timesheets awaiting review.",
        )

        client, _ = Client.objects.get_or_create(code="ACME", defaults={"name": "Acme Corp"})
        Invoice.objects.get_or_create(
            invoice_number="INV-1001",
            defaults={
                "client": client,
                "total_amount": Decimal("4250.00"),
                "status": "pending",
                "issued_on": timezone.now().date(),
            },
        )
        Policy.objects.get_or_create(key="work_week", defaults={"title": "Work Week", "value": "Monday-Sunday"})
        OvertimeRule.objects.get_or_create(
            name="Standard OT",
            defaults={"threshold_hours": Decimal("40.00"), "multiplier": Decimal("1.50"), "is_active": True},
        )
        BillingRate.objects.get_or_create(
            role="employee",
            defaults={"hourly_rate": Decimal("35.00"), "currency": "USD"},
        )
        BillingRate.objects.get_or_create(
            role="manager",
            defaults={"hourly_rate": Decimal("55.00"), "currency": "USD"},
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("Users: employee1, manager1, admin1, finance1")
        self.stdout.write("Password for all demo users: Pass@12345")

    def create_user(self, username, password, role, first_name, last_name, is_staff=False):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_staff": is_staff,
            },
        )
        updated = False
        if user.role != role:
            user.role = role
            updated = True
        if user.is_staff != is_staff:
            user.is_staff = is_staff
            updated = True
        if created or not user.check_password(password):
            user.set_password(password)
            updated = True
        if updated:
            user.save()
        return user
