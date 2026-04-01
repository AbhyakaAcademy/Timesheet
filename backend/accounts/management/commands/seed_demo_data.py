from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User, UserRole
from finance.models import (
    BillingRate,
    Client,
    EmployeeRateOverride,
    Expense,
    ExpenseStatus,
    ExportJob,
    ExportStatus,
    Invoice,
    InvoiceLineItem,
    OvertimeRule,
    Policy,
    ProjectFinanceProfile,
    ProjectRate,
    ProjectTask,
)
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
        users["tenant"] = self.create_user("tenant1", "Pass@12345", UserRole.TENANT, "Tenant", "One")

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

        client, _ = Client.objects.get_or_create(
            code="ACME",
            defaults={
                "name": "Acme Corp",
                "gstin": "29ABCDE1234F1Z5",
                "email": "finance@acme.example",
                "phone": "+91 98765 43210",
                "address": "123 Business Park",
                "state": "Karnataka",
            },
        )
        client_b, _ = Client.objects.get_or_create(
            code="GLBL",
            defaults={
                "name": "Global Solutions Ltd",
                "gstin": "07KLMNO9012L3X7",
                "email": "billing@globalsolutions.example",
                "phone": "+91 98765 43212",
                "address": "55 Tech Plaza, Delhi",
                "state": "Delhi",
            },
        )
        ProjectFinanceProfile.objects.get_or_create(
            project=project_a,
            defaults={
                "budget_hours": Decimal("200.00"),
                "budget_amount": Decimal("500000.00"),
                "current_hours": Decimal("145.00"),
                "current_amount": Decimal("362500.00"),
                "alert_threshold": 80,
            },
        )
        ProjectFinanceProfile.objects.get_or_create(
            project=project_b,
            defaults={
                "budget_hours": Decimal("120.00"),
                "budget_amount": Decimal("180000.00"),
                "current_hours": Decimal("72.00"),
                "current_amount": Decimal("108000.00"),
                "alert_threshold": 75,
            },
        )
        ProjectTask.objects.get_or_create(project=project_a, name="UI/UX Design", defaults={"code": "DES-001"})
        ProjectTask.objects.get_or_create(
            project=project_a,
            name="Frontend Development",
            defaults={"code": "DEV-001"},
        )
        ProjectTask.objects.get_or_create(project=project_b, name="Support Work", defaults={"code": "SUP-001"})
        ProjectRate.objects.get_or_create(
            project=project_a,
            defaults={"hourly_rate": Decimal("2500.00"), "currency": "INR", "is_active": True},
        )
        ProjectRate.objects.get_or_create(
            project=project_b,
            defaults={"hourly_rate": Decimal("1800.00"), "currency": "INR", "is_active": True},
        )
        EmployeeRateOverride.objects.get_or_create(
            employee=users["employee"],
            project=project_a,
            defaults={
                "overrides_role": "Senior Developer",
                "hourly_rate": Decimal("2800.00"),
                "currency": "INR",
                "is_active": True,
            },
        )
        Expense.objects.get_or_create(
            employee=users["employee"],
            project=project_a,
            description="Cloud Hosting Services",
            defaults={
                "date": timezone.now().date() - timedelta(days=10),
                "amount": Decimal("50000.00"),
                "billable": True,
                "status": ExpenseStatus.APPROVED,
                "approved_by": users["finance"],
                "approved_at": timezone.now() - timedelta(days=9),
            },
        )
        Expense.objects.get_or_create(
            employee=users["employee"],
            project=project_b,
            description="Testing Devices",
            defaults={
                "date": timezone.now().date() - timedelta(days=5),
                "amount": Decimal("18000.00"),
                "billable": True,
                "status": ExpenseStatus.APPROVED,
                "approved_by": users["finance"],
                "approved_at": timezone.now() - timedelta(days=4),
            },
        )
        invoice, _ = Invoice.objects.get_or_create(
            invoice_number="INV-2026-001",
            defaults={
                "client": client,
                "financial_year": "2025-26",
                "client_gstin": client.gstin,
                "client_address": client.address,
                "client_state": client.state,
                "supplier_name": "Your Company Name",
                "supplier_gstin": "29XYZAB5678C2D1",
                "supplier_address": "123 Business Street, Bangalore",
                "supplier_state": "Karnataka",
                "issued_on": timezone.now().date(),
                "due_date": timezone.now().date() + timedelta(days=30),
                "status": "Sent",
                "group_by": "project",
                "subtotal": Decimal("250000.00"),
                "cgst": Decimal("22500.00"),
                "sgst": Decimal("22500.00"),
                "igst": Decimal("0.00"),
                "total_amount": Decimal("295000.00"),
                "generated_from": {"timeEntryIds": [], "expenseIds": []},
            },
        )
        invoice_b, _ = Invoice.objects.get_or_create(
            invoice_number="INV-2026-002",
            defaults={
                "client": client_b,
                "financial_year": "2025-26",
                "client_gstin": client_b.gstin,
                "client_address": client_b.address,
                "client_state": client_b.state,
                "supplier_name": "Your Company Name",
                "supplier_gstin": "29XYZAB5678C2D1",
                "supplier_address": "123 Business Street, Bangalore",
                "supplier_state": "Karnataka",
                "issued_on": timezone.now().date() - timedelta(days=7),
                "due_date": timezone.now().date() + timedelta(days=15),
                "status": "Paid",
                "group_by": "project",
                "subtotal": Decimal("90000.00"),
                "cgst": Decimal("0.00"),
                "sgst": Decimal("0.00"),
                "igst": Decimal("16200.00"),
                "total_amount": Decimal("106200.00"),
                "generated_from": {"timeEntryIds": [], "expenseIds": []},
            },
        )
        InvoiceLineItem.objects.get_or_create(
            invoice=invoice,
            description="Tenant Platform - Feature implementation",
            defaults={
                "sac_hsn": "998314",
                "quantity": Decimal("80.00"),
                "rate": Decimal("2500.00"),
                "tax_rate": Decimal("18.00"),
                "amount": Decimal("200000.00"),
                "source_type": "time",
                "source_ids": [],
            },
        )
        InvoiceLineItem.objects.get_or_create(
            invoice=invoice_b,
            description="Internal Ops - Support Work",
            defaults={
                "sac_hsn": "998314",
                "quantity": Decimal("50.00"),
                "rate": Decimal("1800.00"),
                "tax_rate": Decimal("18.00"),
                "amount": Decimal("90000.00"),
                "source_type": "time",
                "source_ids": [],
            },
        )
        ExportJob.objects.get_or_create(
            title="Billing Report",
            range_label="Jan 1, 2026 - Jan 31, 2026",
            format="Excel",
            defaults={
                "status": ExportStatus.READY,
                "file_url": "",
                "created_by": users["finance"],
            },
        )
        ExportJob.objects.get_or_create(
            title="GST Report",
            range_label="Q4 FY 2025-26",
            format="PDF",
            defaults={
                "status": ExportStatus.READY,
                "file_url": "",
                "created_by": users["finance"],
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
        self.stdout.write("Users: employee1, manager1, admin1, finance1, tenant1")
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
