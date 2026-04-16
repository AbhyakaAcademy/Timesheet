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
from tenants.models import (
    Department,
    TenantAuditLog,
    TenantBillingRate,
    TenantOrganization,
    TenantOvertimeRule,
    TenantPolicy,
    TenantSubscription,
)
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
        organization, _ = TenantOrganization.objects.get_or_create(
            slug="acme-corporation",
            defaults={
                "name": "Acme Corporation",
                "industry": "Technology",
                "contact_email": "admin@acme-corp.com",
                "contact_phone": "+91 98765 43210",
                "footer_notes": "Thank you for your business! Payment terms: Net 30 days.",
                "locations_count": 8,
                "cost_centers_count": 24,
            },
        )
        engineering, _ = Department.objects.get_or_create(
            organization=organization,
            name="Engineering",
            defaults={"status": "Active"},
        )
        sales, _ = Department.objects.get_or_create(
            organization=organization,
            name="Sales",
            defaults={"status": "Pending"},
        )
        marketing, _ = Department.objects.get_or_create(
            organization=organization,
            name="Marketing",
            defaults={"status": "Inactive"},
        )

        users = {}
        users["employee"] = self.create_user("employee1", "Pass@12345", UserRole.EMPLOYEE, "Employee", "One", organization=organization, department=engineering)
        users["employee2"] = self.create_user("employee2", "Pass@12345", UserRole.EMPLOYEE, "Ananya", "Rao", organization=organization, department=marketing)
        users["employee3"] = self.create_user("employee3", "Pass@12345", UserRole.EMPLOYEE, "Rahul", "Mehta", organization=organization, department=sales)
        users["manager"] = self.create_user("manager1", "Pass@12345", UserRole.MANAGER, "Manager", "One", organization=organization, department=engineering)
        users["admin"] = self.create_user("admin1", "Pass@12345", UserRole.ADMIN, "Admin", "One", is_staff=True)
        users["finance"] = self.create_user("finance1", "Pass@12345", UserRole.FINANCE, "Finance", "One", organization=organization, department=sales)
        users["tenant"] = self.create_user("tenant1", "Pass@12345", UserRole.TENANT, "Tenant", "One", organization=organization, department=engineering)

        engineering.head = users["manager"]
        engineering.save(update_fields=["head"])

        TenantSubscription.objects.get_or_create(
            organization=organization,
            defaults={
                "plan_name": "Enterprise",
                "billing_cycle": "Annual",
                "licenses": 500,
                "monthly_recurring_revenue": Decimal("649.00"),
                "status": "Active",
                "payment_status": "Paid",
                "renewal_date": timezone.now().date() + timedelta(days=30),
                "history": ["Created on seed"],
            },
        )
        TenantPolicy.objects.get_or_create(
            organization=organization,
            title="Working Hours Policy",
            defaults={
                "description": "Defines standard working hours, break times, and flexible work arrangements",
                "applies_to": "All departments",
                "enabled": True,
                "details": ["Standard shift 9:30 AM to 6:30 PM", "45-minute lunch break"],
            },
        )
        TenantBillingRate.objects.get_or_create(
            organization=organization,
            role="Software Engineer",
            project_name="All Projects",
            defaults={"hourly_rate": Decimal("2500.00"), "rate_type": "Hourly", "is_active": True},
        )
        TenantOvertimeRule.objects.get_or_create(
            organization=organization,
            title="Standard Overtime",
            defaults={"threshold": "After 40 hours", "multiplier": "1.5x", "applies_to": "Hourly Staff", "active": True},
        )
        TenantAuditLog.objects.get_or_create(
            organization=organization,
            actor=users["tenant"],
            action="Created user account",
            resource="john.doe@company.com",
            defaults={
                "actor_name": users["tenant"].get_full_name() or users["tenant"].username,
                "actor_email": users["tenant"].email,
                "details": "New user John Doe was added to the Engineering department with Employee role.",
            },
        )

        project_a, _ = Project.objects.get_or_create(
            code="PRJ-1001",
            defaults={"name": "Tenant Platform", "client_name": "Acme Corp"},
        )
        project_b, _ = Project.objects.get_or_create(
            code="PRJ-1002",
            defaults={"name": "Internal Ops", "client_name": "Internal"},
        )

        TeamMembership.objects.get_or_create(manager=users["manager"], employee=users["employee"])
        TeamMembership.objects.get_or_create(manager=users["manager"], employee=users["employee2"])
        TeamMembership.objects.get_or_create(manager=users["manager"], employee=users["employee3"])

        current_week = week_start_for(timezone.now())
        self.seed_employee_records(
            employee=users["employee"],
            manager=users["manager"],
            current_week=current_week,
            draft_project=project_a,
            draft_description="Feature implementation",
            draft_hours=Decimal("8.00"),
            submitted_project=project_b,
            submitted_description="Support work",
            submitted_hours=Decimal("7.50"),
            approved_project=project_a,
            approved_description="Code review",
            approved_hours=Decimal("6.50"),
            manual_project=project_a,
            manual_note="Backfill entry",
            manual_hours=2,
        )
        self.seed_employee_records(
            employee=users["employee2"],
            manager=users["manager"],
            current_week=current_week,
            draft_project=project_b,
            draft_description="Client coordination",
            draft_hours=Decimal("8.50"),
            submitted_project=project_a,
            submitted_description="Sprint planning",
            submitted_hours=Decimal("8.00"),
            approved_project=project_b,
            approved_description="Documentation updates",
            approved_hours=Decimal("6.00"),
            manual_project=project_b,
            manual_note="Support follow-up",
            manual_hours=1,
        )
        self.seed_employee_records(
            employee=users["employee3"],
            manager=users["manager"],
            current_week=current_week,
            draft_project=project_a,
            draft_description="Testing and QA",
            draft_hours=Decimal("7.00"),
            submitted_project=project_b,
            submitted_description="Bug triage",
            submitted_hours=Decimal("6.50"),
            approved_project=project_a,
            approved_description="Release verification",
            approved_hours=Decimal("7.25"),
            manual_project=project_a,
            manual_note="Regression checks",
            manual_hours=3,
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
        self.stdout.write("Users: employee1, employee2, employee3, manager1, admin1, finance1, tenant1")
        self.stdout.write("Password for all demo users: Pass@12345")

    def create_user(self, username, password, role, first_name, last_name, is_staff=False, organization=None, department=None):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_staff": is_staff,
                "organization": organization,
                "department": department,
            },
        )
        updated = False
        if user.role != role:
            user.role = role
            updated = True
        if user.is_staff != is_staff:
            user.is_staff = is_staff
            updated = True
        if organization is not None and user.organization_id != organization.id:
            user.organization = organization
            updated = True
        if department is not None and user.department_id != department.id:
            user.department = department
            updated = True
        if created or not user.check_password(password):
            user.set_password(password)
            updated = True
        if updated:
            user.save()
        return user

    def seed_employee_records(
        self,
        *,
        employee,
        manager,
        current_week,
        draft_project,
        draft_description,
        draft_hours,
        submitted_project,
        submitted_description,
        submitted_hours,
        approved_project,
        approved_description,
        approved_hours,
        manual_project,
        manual_note,
        manual_hours,
    ):
        draft = (
            Timesheet.objects.filter(
                employee=employee,
                week_start=current_week,
                status=TimesheetStatus.DRAFT,
            )
            .order_by("-created_at")
            .first()
        )
        if draft is None:
            draft = Timesheet.objects.create(
                employee=employee,
                week_start=current_week,
                status=TimesheetStatus.DRAFT,
            )
        TimesheetLine.objects.get_or_create(
            timesheet=draft,
            date=current_week,
            project=draft_project,
            description=draft_description,
            hours=draft_hours,
            shift="DAY",
        )

        submitted_week = current_week - timedelta(days=7)
        submitted = (
            Timesheet.objects.filter(
                employee=employee,
                week_start=submitted_week,
                status=TimesheetStatus.SUBMITTED,
            )
            .order_by("-created_at")
            .first()
        )
        if submitted is None:
            submitted = Timesheet.objects.create(
                employee=employee,
                week_start=submitted_week,
                status=TimesheetStatus.SUBMITTED,
                submitted_at=timezone.now() - timedelta(days=2),
            )
        TimesheetLine.objects.get_or_create(
            timesheet=submitted,
            date=submitted_week,
            project=submitted_project,
            description=submitted_description,
            hours=submitted_hours,
            shift="DAY",
        )

        approved_week = current_week - timedelta(days=14)
        approved = (
            Timesheet.objects.filter(
                employee=employee,
                week_start=approved_week,
                status=TimesheetStatus.APPROVED,
            )
            .order_by("-created_at")
            .first()
        )
        if approved is None:
            approved = Timesheet.objects.create(
                employee=employee,
                week_start=approved_week,
                status=TimesheetStatus.APPROVED,
                submitted_at=timezone.now() - timedelta(days=9),
            )
        TimesheetLine.objects.get_or_create(
            timesheet=approved,
            date=approved_week,
            project=approved_project,
            description=approved_description,
            hours=approved_hours,
            shift="DAY",
        )
        TimesheetApproval.objects.get_or_create(
            timesheet=approved,
            manager=manager,
            action=ApprovalAction.APPROVED,
            defaults={"comment": "Looks good"},
        )

        TimeEntry.objects.get_or_create(
            employee=employee,
            project=manual_project,
            source=TimeEntrySource.MANUAL,
            start_time=timezone.now() - timedelta(hours=manual_hours + 1),
            end_time=timezone.now() - timedelta(hours=1),
            defaults={"duration_minutes": manual_hours * 60, "note": manual_note},
        )

        Notification.objects.get_or_create(
            recipient=employee,
            title="Welcome",
            message="Your demo account is ready.",
        )
