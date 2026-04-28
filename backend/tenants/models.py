from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class TenantOrganization(models.Model):
    name = models.CharField(max_length=140)
    slug = models.SlugField(max_length=160, unique=True)
    industry = models.CharField(max_length=120, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    timezone = models.CharField(max_length=80, default="India Standard Time (IST) - UTC+5:30")
    currency = models.CharField(max_length=40, default="Indian Rupee (INR)")
    week_start = models.CharField(max_length=20, default="Monday")
    pay_period = models.CharField(max_length=20, default="Monthly")
    rounding = models.CharField(max_length=20, default="15 minutes")
    max_hours = models.PositiveSmallIntegerField(default=12)
    date_format = models.CharField(max_length=40, default="DD-MM-YYYY")
    time_format = models.CharField(max_length=30, default="24-hour")
    logo_text = models.CharField(max_length=20, default="AC")
    primary_color = models.CharField(max_length=20, default="#4F46E5")
    secondary_color = models.CharField(max_length=20, default="#9333EA")
    footer_notes = models.TextField(blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    payment_methods = models.JSONField(default=list, blank=True)
    locations_count = models.PositiveIntegerField(default=0)
    cost_centers_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "tenant"
            slug = base_slug
            index = 2
            while TenantOrganization.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{index}"
                index += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DepartmentStatus(models.TextChoices):
    ACTIVE = "Active", "Active"
    PENDING = "Pending", "Pending"
    INACTIVE = "Inactive", "Inactive"


class Department(models.Model):
    organization = models.ForeignKey(TenantOrganization, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=120)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="headed_departments",
    )
    status = models.CharField(max_length=20, choices=DepartmentStatus.choices, default=DepartmentStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        unique_together = ("organization", "name")


class TenantPolicy(models.Model):
    organization = models.ForeignKey(TenantOrganization, on_delete=models.CASCADE, related_name="policies")
    title = models.CharField(max_length=140)
    description = models.TextField()
    applies_to = models.CharField(max_length=120, default="All users")
    enabled = models.BooleanField(default=True)
    details = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("title",)


class TenantBillingRate(models.Model):
    organization = models.ForeignKey(TenantOrganization, on_delete=models.CASCADE, related_name="billing_rates")
    role = models.CharField(max_length=80)
    project_name = models.CharField(max_length=140, default="All Projects")
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    rate_type = models.CharField(max_length=40, default="Hourly")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("role", "project_name")


class TenantOvertimeRule(models.Model):
    organization = models.ForeignKey(TenantOrganization, on_delete=models.CASCADE, related_name="overtime_rules")
    title = models.CharField(max_length=140)
    threshold = models.CharField(max_length=120)
    multiplier = models.CharField(max_length=40)
    applies_to = models.CharField(max_length=120, default="All Employees")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("title",)


class SubscriptionStatus(models.TextChoices):
    ACTIVE = "Active", "Active"
    TRIAL = "Trial", "Trial"
    INACTIVE = "Inactive", "Inactive"


class PaymentStatus(models.TextChoices):
    PAID = "Paid", "Paid"
    PENDING = "Pending", "Pending"
    OVERDUE = "Overdue", "Overdue"


class TenantSubscription(models.Model):
    organization = models.OneToOneField(TenantOrganization, on_delete=models.CASCADE, related_name="subscription")
    plan_name = models.CharField(max_length=60, default="Enterprise")
    billing_cycle = models.CharField(max_length=20, default="Annual")
    licenses = models.PositiveIntegerField(default=100)
    monthly_recurring_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=SubscriptionStatus.choices, default=SubscriptionStatus.ACTIVE)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PAID)
    renewal_date = models.DateField(null=True, blank=True)
    history = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class TenantAuditLog(models.Model):
    organization = models.ForeignKey(TenantOrganization, on_delete=models.CASCADE, related_name="audit_logs")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tenant_audit_logs",
    )
    actor_name = models.CharField(max_length=150, blank=True)
    actor_email = models.EmailField(blank=True)
    action = models.CharField(max_length=140)
    resource = models.CharField(max_length=140)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")


class DashboardActivityLog(models.Model):
    organization = models.ForeignKey(
        TenantOrganization,
        on_delete=models.CASCADE,
        related_name="dashboard_activity_logs",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dashboard_activity_logs",
    )
    actor_name = models.CharField(max_length=150, blank=True)
    actor_email = models.EmailField(blank=True)
    actor_role = models.CharField(max_length=40, blank=True)
    dashboard = models.CharField(max_length=40)
    path = models.CharField(max_length=255, blank=True)
    event_type = models.CharField(max_length=40)
    severity = models.CharField(max_length=20, default="info")
    summary = models.CharField(max_length=180)
    details = models.TextField(blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")


class PlatformSettings(models.Model):
    full_name = models.CharField(max_length=140, default="Admin User")
    email = models.EmailField(default="admin@abhyaka.com")
    platform_name = models.CharField(max_length=140, default="Abhyaka")
    primary_color = models.CharField(max_length=20, default="#2563eb")
    api_key = models.CharField(max_length=120, blank=True)
    allow_new_signups = models.BooleanField(default=True)
    require_email_verification = models.BooleanField(default=True)
    auto_suspend_overdue = models.BooleanField(default=True)
    smtp_connected = models.BooleanField(default=False)
    analytics_connected = models.BooleanField(default=False)
    slack_connected = models.BooleanField(default=False)
    trial_period = models.PositiveIntegerField(default=14)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
