from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsAdmin, IsTenantOrAdmin
from finance.models import Invoice
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
from tenants.serializers import (
    DepartmentSerializer,
    PlatformSettingsSerializer,
    TenantAuditLogSerializer,
    TenantBillingRateSerializer,
    TenantOrganizationSerializer,
    TenantOvertimeRuleSerializer,
    TenantPolicySerializer,
    TenantSettingsSerializer,
    TenantSubscriptionSerializer,
    TenantUserSerializer,
)

User = get_user_model()


class TenantOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        users = User.objects.filter(organization=organization)
        departments = organization.departments.all()
        subscription = _get_or_create_subscription(organization)
        active_users = users.filter(is_active=True).count()
        payload = {
            "organization": organization.name,
            "totalUsers": users.count(),
            "activeUsers": active_users,
            "activeDepartments": departments.filter(status="Active").count(),
            "pendingDepartments": departments.filter(status="Pending").count(),
            "currentPlan": subscription.plan_name,
            "licenses": subscription.licenses,
            "usagePercent": round((active_users / max(subscription.licenses, 1)) * 100),
            "monthlyRevenue": float(subscription.monthly_recurring_revenue),
            "adminProfile": _build_admin_profile(organization, request.user),
        }
        return Response(payload)


class TenantUsersView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        users = User.objects.filter(organization=organization).select_related("department").order_by("-date_joined")
        return Response(TenantUserSerializer(users, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        user = _create_or_update_user(request.data, organization=organization)
        _log_action(
            organization=organization,
            actor=request.user,
            action="Created user account",
            resource=user.email or user.username,
            details=f"{user.get_full_name() or user.username} was added with {user.role} role.",
        )
        return Response(TenantUserSerializer(user).data, status=status.HTTP_201_CREATED)


class TenantUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def patch(self, request, user_id):
        organization = _get_request_organization(request.user)
        user = get_object_or_404(User, id=user_id, organization=organization)
        user = _create_or_update_user(request.data, instance=user, organization=organization)
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated user account",
            resource=user.email or user.username,
            details=f"{user.get_full_name() or user.username} account details were updated.",
        )
        return Response(TenantUserSerializer(user).data)

    def delete(self, request, user_id):
        organization = _get_request_organization(request.user)
        user = get_object_or_404(User, id=user_id, organization=organization)
        resource = user.email or user.username
        user.delete()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Deleted user account",
            resource=resource,
            details=f"{resource} was removed from the organization.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantDepartmentsView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        departments = Department.objects.filter(organization=organization).select_related("head").prefetch_related("users")
        return Response(DepartmentSerializer(departments, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        department = Department.objects.create(
            organization=organization,
            name=request.data.get("name", "").strip(),
            head=_resolve_org_user(organization, request.data.get("head")),
            status=request.data.get("status") or "Active",
        )
        _log_action(
            organization=organization,
            actor=request.user,
            action="Created department",
            resource=department.name,
            details=f"{department.name} department was created.",
        )
        return Response(DepartmentSerializer(department).data, status=status.HTTP_201_CREATED)


class TenantDepartmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def patch(self, request, department_id):
        organization = _get_request_organization(request.user)
        department = get_object_or_404(Department, id=department_id, organization=organization)
        if "name" in request.data:
            department.name = request.data["name"].strip()
        if "status" in request.data:
            department.status = request.data["status"]
        if "head" in request.data:
            department.head = _resolve_org_user(organization, request.data.get("head"))
        department.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated department",
            resource=department.name,
            details=f"{department.name} department was updated.",
        )
        return Response(DepartmentSerializer(department).data)

    def delete(self, request, department_id):
        organization = _get_request_organization(request.user)
        department = get_object_or_404(Department, id=department_id, organization=organization)
        resource = department.name
        department.delete()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Deleted department",
            resource=resource,
            details=f"{resource} department was deleted.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantPoliciesView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        policies = TenantPolicy.objects.filter(organization=organization)
        return Response(TenantPolicySerializer(policies, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        policy = TenantPolicy.objects.create(
            organization=organization,
            title=request.data.get("title") or request.data.get("name") or "",
            description=request.data.get("description") or "",
            applies_to=request.data.get("applies_to") or request.data.get("appliesTo") or "All users",
            enabled=request.data.get("enabled", True),
            details=request.data.get("details") or ["Custom policy details will be configured after creation."],
        )
        _log_action(
            organization=organization,
            actor=request.user,
            action="Created policy",
            resource=policy.title,
            details=f"{policy.title} policy was created.",
        )
        return Response(TenantPolicySerializer(policy).data, status=status.HTTP_201_CREATED)


class TenantPolicyDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def patch(self, request, policy_id):
        organization = _get_request_organization(request.user)
        policy = get_object_or_404(TenantPolicy, id=policy_id, organization=organization)
        for field, keys in {
            "title": ["title", "name"],
            "description": ["description"],
            "applies_to": ["applies_to", "appliesTo"],
            "enabled": ["enabled"],
            "details": ["details"],
        }.items():
            for key in keys:
                if key in request.data:
                    setattr(policy, field, request.data[key])
                    break
        policy.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated policy",
            resource=policy.title,
            details=f"{policy.title} policy was updated.",
        )
        return Response(TenantPolicySerializer(policy).data)

    def delete(self, request, policy_id):
        organization = _get_request_organization(request.user)
        policy = get_object_or_404(TenantPolicy, id=policy_id, organization=organization)
        resource = policy.title
        policy.delete()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Deleted policy",
            resource=resource,
            details=f"{resource} policy was deleted.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantBillingRatesView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        queryset = TenantBillingRate.objects.filter(organization=organization).order_by("role", "project_name")
        return Response(TenantBillingRateSerializer(queryset, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        rate = TenantBillingRate.objects.create(
            organization=organization,
            role=request.data.get("role", ""),
            project_name=request.data.get("project_name") or request.data.get("project") or "All Projects",
            hourly_rate=request.data.get("hourly_rate") or request.data.get("rate") or 0,
            rate_type=request.data.get("rate_type") or request.data.get("type") or "Hourly",
            is_active=request.data.get("is_active", True),
        )
        _log_action(
            organization=organization,
            actor=request.user,
            action="Created billing rate",
            resource=f"{rate.role} / {rate.project_name}",
            details=f"Billing rate for {rate.role} was created.",
        )
        return Response(TenantBillingRateSerializer(rate).data, status=status.HTTP_201_CREATED)


class TenantBillingRateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def patch(self, request, rate_id):
        organization = _get_request_organization(request.user)
        rate = get_object_or_404(TenantBillingRate, id=rate_id, organization=organization)
        if "role" in request.data:
            rate.role = request.data["role"]
        if "project_name" in request.data or "project" in request.data:
            rate.project_name = request.data.get("project_name") or request.data.get("project")
        if "hourly_rate" in request.data or "rate" in request.data:
            rate.hourly_rate = request.data.get("hourly_rate") or request.data.get("rate")
        if "rate_type" in request.data or "type" in request.data:
            rate.rate_type = request.data.get("rate_type") or request.data.get("type")
        if "is_active" in request.data:
            rate.is_active = request.data["is_active"]
        rate.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated billing rate",
            resource=f"{rate.role} / {rate.project_name}",
            details=f"Billing rate for {rate.role} was updated.",
        )
        return Response(TenantBillingRateSerializer(rate).data)

    def delete(self, request, rate_id):
        organization = _get_request_organization(request.user)
        rate = get_object_or_404(TenantBillingRate, id=rate_id, organization=organization)
        resource = f"{rate.role} / {rate.project_name}"
        rate.delete()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Deleted billing rate",
            resource=resource,
            details=f"{resource} billing rate was deleted.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantOvertimeRulesView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        queryset = TenantOvertimeRule.objects.filter(organization=organization)
        return Response(TenantOvertimeRuleSerializer(queryset, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        rule = TenantOvertimeRule.objects.create(
            organization=organization,
            title=request.data.get("title", ""),
            threshold=request.data.get("threshold", ""),
            multiplier=request.data.get("multiplier", ""),
            applies_to=request.data.get("applies_to") or request.data.get("appliesTo") or "All Employees",
            active=request.data.get("active", True),
        )
        _log_action(
            organization=organization,
            actor=request.user,
            action="Created overtime rule",
            resource=rule.title,
            details=f"{rule.title} overtime rule was created.",
        )
        return Response(TenantOvertimeRuleSerializer(rule).data, status=status.HTTP_201_CREATED)


class TenantOvertimeRuleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def patch(self, request, rule_id):
        organization = _get_request_organization(request.user)
        rule = get_object_or_404(TenantOvertimeRule, id=rule_id, organization=organization)
        for field, keys in {
            "title": ["title"],
            "threshold": ["threshold"],
            "multiplier": ["multiplier"],
            "applies_to": ["applies_to", "appliesTo"],
            "active": ["active"],
        }.items():
            for key in keys:
                if key in request.data:
                    setattr(rule, field, request.data[key])
                    break
        rule.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated overtime rule",
            resource=rule.title,
            details=f"{rule.title} overtime rule was updated.",
        )
        return Response(TenantOvertimeRuleSerializer(rule).data)

    def delete(self, request, rule_id):
        organization = _get_request_organization(request.user)
        rule = get_object_or_404(TenantOvertimeRule, id=rule_id, organization=organization)
        resource = rule.title
        rule.delete()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Deleted overtime rule",
            resource=resource,
            details=f"{resource} overtime rule was deleted.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        return Response(TenantSubscriptionSerializer(_get_or_create_subscription(organization)).data)

    def patch(self, request):
        organization = _get_request_organization(request.user)
        subscription = _get_or_create_subscription(organization)
        if "plan_name" in request.data or "currentPlan" in request.data:
            subscription.plan_name = request.data.get("plan_name") or request.data.get("currentPlan")
        if "billing_cycle" in request.data or "billingCycle" in request.data:
            subscription.billing_cycle = request.data.get("billing_cycle") or request.data.get("billingCycle")
        if "licenses" in request.data:
            subscription.licenses = int(request.data["licenses"])
        if "monthly_recurring_revenue" in request.data or "monthlyRevenue" in request.data:
            subscription.monthly_recurring_revenue = request.data.get("monthly_recurring_revenue") or request.data.get("monthlyRevenue")
        if "status" in request.data:
            subscription.status = request.data["status"]
        if "payment_status" in request.data or "paymentStatus" in request.data:
            subscription.payment_status = request.data.get("payment_status") or request.data.get("paymentStatus")
        if "history" in request.data:
            subscription.history = request.data["history"]
        subscription.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated subscription",
            resource=subscription.plan_name,
            details=f"Subscription settings updated to {subscription.plan_name}.",
        )
        return Response(TenantSubscriptionSerializer(subscription).data)


class TenantSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        return Response(
            {
                "organization": TenantSettingsSerializer(organization).data,
                "adminProfile": _build_admin_profile(organization, request.user),
            }
        )

    def patch(self, request):
        organization = _get_request_organization(request.user)
        field_map = {
            "name": ["name", "tenantName"],
            "timezone": ["timezone", "timeZone"],
            "currency": ["currency"],
            "week_start": ["week_start", "weekStart"],
            "pay_period": ["pay_period", "payPeriod"],
            "rounding": ["rounding"],
            "max_hours": ["max_hours", "maxHours"],
            "date_format": ["date_format", "dateFormat"],
            "time_format": ["time_format", "timeFormat"],
            "logo_text": ["logo_text", "logoText"],
            "primary_color": ["primary_color", "primary"],
            "secondary_color": ["secondary_color", "secondary"],
            "footer_notes": ["footer_notes", "footerNotes"],
            "locations_count": ["locations_count"],
            "cost_centers_count": ["cost_centers_count"],
        }
        for field, keys in field_map.items():
            for key in keys:
                if key in request.data:
                    value = request.data[key]
                    if field == "max_hours" and isinstance(value, str):
                        value = int("".join(ch for ch in value if ch.isdigit()) or organization.max_hours)
                    setattr(organization, field, value)
                    break
        organization.save()
        _log_action(
            organization=organization,
            actor=request.user,
            action="Updated settings",
            resource=organization.name,
            details="Organization settings were updated.",
        )
        return Response(
            {
                "organization": TenantSettingsSerializer(organization).data,
                "adminProfile": _build_admin_profile(organization, request.user),
            }
        )


class TenantAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsTenantOrAdmin]

    def get(self, request):
        organization = _get_request_organization(request.user)
        logs = TenantAuditLog.objects.filter(organization=organization)[:100]
        return Response(TenantAuditLogSerializer(logs, many=True).data)


class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        organizations = TenantOrganization.objects.all()
        subscriptions = TenantSubscription.objects.all()
        monthly_revenue = subscriptions.aggregate(total=Sum("monthly_recurring_revenue"))["total"] or Decimal("0")
        revenue_by_month = []
        now = timezone.now()
        for index in range(5, -1, -1):
            month_date = now - timedelta(days=index * 30)
            revenue_by_month.append(
                {
                    "month": month_date.strftime("%b"),
                    "revenue": float(monthly_revenue),
                    "users": User.objects.filter(date_joined__lte=month_date).count(),
                }
            )
        payload = {
            "totalClients": organizations.count(),
            "totalUsers": User.objects.count(),
            "monthlyRevenue": float(monthly_revenue),
            "activeSubscriptions": subscriptions.filter(status="Active").count(),
            "recentClients": TenantOrganizationSerializer(organizations[:5], many=True).data,
            "revenueData": revenue_by_month,
        }
        return Response(payload)


class AdminClientsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        organizations = TenantOrganization.objects.all().order_by("name")
        return Response(TenantOrganizationSerializer(organizations, many=True).data)

    def post(self, request):
        organization = TenantOrganization.objects.create(
            name=request.data.get("name", ""),
            slug=slugify(request.data.get("name", "")),
            industry=request.data.get("industry", ""),
            contact_email=request.data.get("email", ""),
            contact_phone=request.data.get("phone", ""),
            is_active=(request.data.get("status", "Active") == "Active"),
        )
        TenantSubscription.objects.create(
            organization=organization,
            plan_name=request.data.get("plan", "Professional"),
            licenses=int(request.data.get("users") or 25),
            monthly_recurring_revenue=Decimal(str(request.data.get("revenue") or 0)),
            renewal_date=timezone.now().date() + timedelta(days=30),
        )
        return Response(TenantOrganizationSerializer(organization).data, status=status.HTTP_201_CREATED)


class AdminClientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, organization_id):
        organization = get_object_or_404(TenantOrganization, id=organization_id)
        if "name" in request.data:
            organization.name = request.data["name"]
        if "industry" in request.data:
            organization.industry = request.data["industry"]
        if "email" in request.data:
            organization.contact_email = request.data["email"]
        if "phone" in request.data:
            organization.contact_phone = request.data["phone"]
        if "status" in request.data:
            organization.is_active = request.data["status"] == "Active"
        organization.save()
        subscription = _get_or_create_subscription(organization)
        if "plan" in request.data:
            subscription.plan_name = request.data["plan"]
        if "users" in request.data:
            subscription.licenses = int(request.data["users"])
        if "revenue" in request.data:
            subscription.monthly_recurring_revenue = Decimal(str(request.data["revenue"]))
        subscription.save()
        return Response(TenantOrganizationSerializer(organization).data)

    def delete(self, request, organization_id):
        organization = get_object_or_404(TenantOrganization, id=organization_id)
        organization.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.select_related("organization", "department").order_by("-date_joined")
        return Response(TenantUserSerializer(users, many=True).data)

    def post(self, request):
        organization = _resolve_organization(request.data.get("organization"))
        user = _create_or_update_user(request.data, organization=organization)
        return Response(TenantUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        organization = _resolve_organization(request.data.get("organization"), fallback=user.organization)
        user = _create_or_update_user(request.data, instance=user, organization=organization)
        return Response(TenantUserSerializer(user).data)

    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminSubscriptionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        subscriptions = TenantSubscription.objects.select_related("organization").all().order_by("organization__name")
        return Response(
            [
                {
                    "id": sub.id,
                    "client": sub.organization.name,
                    "plan": sub.plan_name,
                    "status": sub.status,
                    "users": sub.licenses,
                    "mrr": float(sub.monthly_recurring_revenue),
                    "renewalDate": sub.renewal_date,
                    "paymentStatus": sub.payment_status,
                    "history": sub.history,
                }
                for sub in subscriptions
            ]
        )

    def patch(self, request):
        subscription = get_object_or_404(TenantSubscription, id=request.data.get("id"))
        for field, key in {
            "plan_name": "plan",
            "status": "status",
            "licenses": "users",
            "monthly_recurring_revenue": "mrr",
            "payment_status": "paymentStatus",
            "history": "history",
        }.items():
            if key in request.data:
                setattr(subscription, field, request.data[key])
        subscription.save()
        return Response({"success": True})


class AdminRevenueView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        invoices = Invoice.objects.select_related("client").all()
        monthly = sum((invoice.total_amount for invoice in invoices), Decimal("0"))
        top_clients = (
            invoices.values("client__name")
            .annotate(revenue=Sum("total_amount"))
            .order_by("-revenue")[:5]
        )
        return Response(
            {
                "monthlyRevenue": float(monthly),
                "quarterlyRevenue": float(monthly * 3),
                "annualRevenue": float(monthly * 12),
                "topPayingClients": [
                    {"name": item["client__name"], "revenue": float(item["revenue"] or 0)} for item in top_clients
                ],
            }
        )


class AdminSystemHealthView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(
            {
                "api": "Operational",
                "database": "Connected",
                "organizations": TenantOrganization.objects.count(),
                "users": User.objects.count(),
                "activeSubscriptions": TenantSubscription.objects.filter(status="Active").count(),
            }
        )


class AdminSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(PlatformSettingsSerializer(_get_platform_settings()).data)

    def patch(self, request):
        settings = _get_platform_settings()
        for field in PlatformSettingsSerializer.Meta.fields:
            if field == "id":
                continue
            if field in request.data:
                setattr(settings, field, request.data[field])
        settings.save()
        return Response(PlatformSettingsSerializer(settings).data)


def _get_request_organization(user):
    if getattr(user, "organization_id", None):
        return user.organization
    if user.role == UserRole.ADMIN:
        organization = TenantOrganization.objects.order_by("id").first()
        if organization:
            return organization
    raise ValidationError({"organization": "No tenant organization is linked to this user."})


def _resolve_organization(value, fallback=None):
    if value in (None, ""):
        return fallback
    return get_object_or_404(TenantOrganization, id=value)


def _resolve_org_user(organization, value):
    if value in (None, ""):
        return None
    return get_object_or_404(User, id=value, organization=organization)


def _build_admin_profile(organization, fallback_user):
    user = (
        User.objects.filter(organization=organization, role__in=[UserRole.TENANT, UserRole.ADMIN])
        .order_by("id")
        .first()
        or fallback_user
    )
    return {
        "name": user.get_full_name() or user.username,
        "role": "Tenant Admin" if user.role == UserRole.TENANT else user.role.title(),
        "email": user.email,
        "phone": organization.contact_phone,
    }


def _get_or_create_subscription(organization):
    subscription, _ = TenantSubscription.objects.get_or_create(
        organization=organization,
        defaults={
            "plan_name": "Enterprise",
            "billing_cycle": "Annual",
            "licenses": 500,
            "monthly_recurring_revenue": Decimal("649.00"),
            "renewal_date": timezone.now().date() + timedelta(days=30),
            "history": ["Subscription initialized"],
        },
    )
    return subscription


def _get_platform_settings():
    settings = PlatformSettings.objects.order_by("id").first()
    if settings is None:
        settings = PlatformSettings.objects.create()
    return settings


def _split_name(value):
    parts = [part for part in (value or "").strip().split() if part]
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _build_username(name, email):
    seed = (email or "").split("@")[0] or slugify(name).replace("-", "") or "user"
    username = seed[:150]
    original = username
    index = 2
    while User.objects.filter(username=username).exists():
        username = f"{original[:140]}{index}"
        index += 1
    return username


@transaction.atomic
def _create_or_update_user(payload, organization=None, instance=None):
    name = payload.get("name", "")
    email = payload.get("email", "")
    role = payload.get("role") or getattr(instance, "role", UserRole.EMPLOYEE)
    department_name = payload.get("department")
    status_value = payload.get("status")
    first_name, last_name = _split_name(name)

    if instance is None:
        username = payload.get("username") or _build_username(name, email)
        instance = User(username=username, email=email, role=role, organization=organization)
        instance.set_password(payload.get("password") or "Pass@12345")

    if organization is not None:
        instance.organization = organization
    if name:
        instance.first_name = first_name
        instance.last_name = last_name
    if email:
        instance.email = email
    if role:
        instance.role = role
    if status_value:
        instance.is_active = status_value == "Active"
    if payload.get("is_active") is not None:
        instance.is_active = bool(payload.get("is_active"))

    instance.save()

    if department_name and organization is not None:
        department = Department.objects.filter(organization=organization, name=department_name).first()
        if department is None:
            department = Department.objects.create(organization=organization, name=department_name, status="Active")
        instance.department = department
        instance.save(update_fields=["department"])

    return instance


def _log_action(*, organization, actor, action, resource, details):
    TenantAuditLog.objects.create(
        organization=organization,
        actor=actor,
        actor_name=actor.get_full_name() or actor.username,
        actor_email=actor.email or "",
        action=action,
        resource=resource,
        details=details,
    )
