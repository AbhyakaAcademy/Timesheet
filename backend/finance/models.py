from django.conf import settings
from django.db import models

from timesheets.models import Project


class Client(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40, unique=True)
    gstin = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=80, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=40, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices")
    financial_year = models.CharField(max_length=9, default="")
    client_gstin = models.CharField(max_length=40, blank=True)
    client_address = models.CharField(max_length=255, blank=True)
    client_state = models.CharField(max_length=80, blank=True)
    supplier_name = models.CharField(max_length=140, blank=True)
    supplier_gstin = models.CharField(max_length=40, blank=True)
    supplier_address = models.CharField(max_length=255, blank=True)
    supplier_state = models.CharField(max_length=80, blank=True)
    issued_on = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default="Draft")
    group_by = models.CharField(max_length=20, default="project")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cgst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    generated_from = models.JSONField(default=dict)

    class Meta:
        ordering = ("-issued_on", "invoice_number")


class Policy(models.Model):
    key = models.CharField(max_length=80, unique=True)
    title = models.CharField(max_length=140)
    value = models.CharField(max_length=300)


class OvertimeRule(models.Model):
    name = models.CharField(max_length=120)
    threshold_hours = models.DecimalField(max_digits=5, decimal_places=2)
    multiplier = models.DecimalField(max_digits=4, decimal_places=2)
    is_active = models.BooleanField(default=True)


class BillingRate(models.Model):
    role = models.CharField(max_length=30, unique=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")


class ProjectFinanceProfile(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="finance_profile")
    budget_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    budget_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    alert_threshold = models.PositiveSmallIntegerField(default=80)


class ProjectTask(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ProjectRate(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_rates")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    is_active = models.BooleanField(default=True)


class EmployeeRateOverride(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rate_overrides",
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="employee_rate_overrides")
    overrides_role = models.CharField(max_length=60, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    is_active = models.BooleanField(default=True)


class ExpenseStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class Expense(models.Model):
    date = models.DateField()
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="expenses")
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    billable = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=ExpenseStatus.choices, default=ExpenseStatus.PENDING)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_expenses",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class InvoiceLineItem(models.Model):
    class SourceType(models.TextChoices):
        TIME = "time", "Time"
        EXPENSE = "expense", "Expense"
        MANUAL = "manual", "Manual"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    description = models.CharField(max_length=255)
    sac_hsn = models.CharField(max_length=30, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    source_type = models.CharField(max_length=20, choices=SourceType.choices, default=SourceType.MANUAL)
    source_ids = models.JSONField(default=list)

    class Meta:
        ordering = ("id",)


class ExportStatus(models.TextChoices):
    QUEUED = "QUEUED", "Queued"
    READY = "READY", "Ready"
    FAILED = "FAILED", "Failed"


class ExportJob(models.Model):
    title = models.CharField(max_length=120)
    range_label = models.CharField(max_length=120)
    format = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=ExportStatus.choices, default=ExportStatus.QUEUED)
    file_url = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="finance_exports",
    )
    created_at = models.DateTimeField(auto_now_add=True)
