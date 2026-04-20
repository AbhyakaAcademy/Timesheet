from django.contrib.auth import get_user_model
from rest_framework import serializers

from tenants.models import (
    Department,
    PlatformSettings,
    TenantAuditLog,
    TenantBillingRate,
    TenantOrganization,
    TenantOvertimeRule,
    TenantPolicy,
    TenantSubscription,
)

User = get_user_model()


class TenantOrganizationSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()
    createdDate = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()

    class Meta:
        model = TenantOrganization
        fields = (
            "id",
            "name",
            "slug",
            "industry",
            "contact_email",
            "contact_phone",
            "is_active",
            "status",
            "users",
            "revenue",
            "createdDate",
            "plan",
        )

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_users(self, obj):
        return obj.users.count()

    def get_revenue(self, obj):
        subscription = getattr(obj, "subscription", None)
        return float(subscription.monthly_recurring_revenue) if subscription else 0

    def get_createdDate(self, obj):
        return obj.created_at.strftime("%b %d, %Y")

    def get_plan(self, obj):
        subscription = getattr(obj, "subscription", None)
        return subscription.plan_name if subscription else "N/A"


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    employees = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ("id", "name", "head", "head_name", "employees", "status", "created")

    def get_head_name(self, obj):
        if not obj.head:
            return ""
        return obj.head.get_full_name() or obj.head.username

    def get_employees(self, obj):
        return f"{obj.users.count()} members"

    def get_created(self, obj):
        return f"Created {obj.created_at.strftime('%b %Y')}"


class TenantPolicySerializer(serializers.ModelSerializer):
    desc = serializers.CharField(source="description", read_only=True)
    applies = serializers.CharField(source="applies_to", read_only=True)
    lastUpdated = serializers.SerializerMethodField()

    class Meta:
        model = TenantPolicy
        fields = (
            "id",
            "title",
            "description",
            "desc",
            "applies_to",
            "applies",
            "enabled",
            "details",
            "lastUpdated",
        )

    def get_lastUpdated(self, obj):
        return obj.updated_at.strftime("%b %d, %Y")


class TenantBillingRateSerializer(serializers.ModelSerializer):
    project = serializers.CharField(source="project_name", read_only=True)
    rate = serializers.SerializerMethodField()
    type = serializers.CharField(source="rate_type", read_only=True)

    class Meta:
        model = TenantBillingRate
        fields = ("id", "role", "project_name", "project", "hourly_rate", "rate", "rate_type", "type", "is_active")

    def get_rate(self, obj):
        return f"INR {obj.hourly_rate}/hour"


class TenantOvertimeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantOvertimeRule
        fields = ("id", "title", "threshold", "multiplier", "applies_to", "active")


class TenantSubscriptionSerializer(serializers.ModelSerializer):
    currentPlan = serializers.CharField(source="plan_name", read_only=True)
    billingCycle = serializers.CharField(source="billing_cycle", read_only=True)
    monthlyRevenue = serializers.DecimalField(source="monthly_recurring_revenue", max_digits=12, decimal_places=2, read_only=True)
    renewalDate = serializers.DateField(source="renewal_date", read_only=True)
    paymentStatus = serializers.CharField(source="payment_status", read_only=True)

    class Meta:
        model = TenantSubscription
        fields = (
            "id",
            "plan_name",
            "currentPlan",
            "billing_cycle",
            "billingCycle",
            "licenses",
            "monthly_recurring_revenue",
            "monthlyRevenue",
            "status",
            "payment_status",
            "paymentStatus",
            "renewal_date",
            "renewalDate",
            "history",
        )


class TenantAuditLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    email = serializers.CharField(source="actor_email", read_only=True)

    class Meta:
        model = TenantAuditLog
        fields = ("id", "timestamp", "user", "email", "action", "resource", "details")

    def get_timestamp(self, obj):
        return obj.created_at.strftime("%b %d, %Y %I:%M %p")

    def get_user(self, obj):
        if obj.actor_name:
            return obj.actor_name
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return ""


class TenantUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    lastActive = serializers.SerializerMethodField()
    joinDate = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "name",
            "email",
            "role",
            "status",
            "department",
            "lastActive",
            "joinDate",
            "organization",
            "organization_name",
        )

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_department(self, obj):
        return obj.department.name if getattr(obj, "department", None) else "General"

    def get_lastActive(self, obj):
        if obj.last_login:
            return obj.last_login.strftime("%b %d, %Y %H:%M")
        return "Never"

    def get_joinDate(self, obj):
        return obj.date_joined.strftime("%b %d, %Y")


class TenantSettingsSerializer(serializers.ModelSerializer):
    tenantName = serializers.CharField(source="name", read_only=True)
    timeZone = serializers.CharField(source="timezone", read_only=True)
    weekStart = serializers.CharField(source="week_start", read_only=True)
    payPeriod = serializers.CharField(source="pay_period", read_only=True)
    dateFormat = serializers.CharField(source="date_format", read_only=True)
    timeFormat = serializers.CharField(source="time_format", read_only=True)
    maxHours = serializers.SerializerMethodField()
    logoText = serializers.CharField(source="logo_text", read_only=True)
    primary = serializers.CharField(source="primary_color", read_only=True)
    secondary = serializers.CharField(source="secondary_color", read_only=True)
    footerNotes = serializers.CharField(source="footer_notes", read_only=True)

    class Meta:
        model = TenantOrganization
        fields = (
            "id",
            "name",
            "tenantName",
            "timezone",
            "timeZone",
            "currency",
            "week_start",
            "weekStart",
            "pay_period",
            "payPeriod",
            "rounding",
            "max_hours",
            "maxHours",
            "date_format",
            "dateFormat",
            "time_format",
            "timeFormat",
            "logo_text",
            "logoText",
            "primary_color",
            "primary",
            "secondary_color",
            "secondary",
            "footer_notes",
            "footerNotes",
            "locations_count",
            "cost_centers_count",
        )

    def get_maxHours(self, obj):
        return f"{obj.max_hours} hours"


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = (
            "id",
            "full_name",
            "email",
            "platform_name",
            "primary_color",
            "api_key",
            "allow_new_signups",
            "require_email_verification",
            "auto_suspend_overdue",
            "smtp_connected",
            "analytics_connected",
            "slack_connected",
            "trial_period",
        )
