from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO
import re

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsAdmin, IsTenantOrAdmin
from accounts.services import send_user_invitation_email
from finance.models import Invoice
from tenants.models import (
    DashboardActivityLog,
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
    DashboardActivityLogSerializer,
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
from django.core.mail import EmailMultiAlternatives
from finance.models import Client, Invoice, InvoiceLineItem
from timesheets.models import TimeEntry, TimesheetLine

User = get_user_model()


class PublicLandingStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())
        previous_week_start = week_start - timedelta(days=7)
        previous_week_end = week_start - timedelta(days=1)

        active_organizations = TenantOrganization.objects.filter(is_active=True)
        active_users = User.objects.filter(organization__in=active_organizations, is_active=True).exclude(role=UserRole.TENANT)

        today_minutes = (
            TimeEntry.objects.filter(employee__in=active_users, start_time__date=today).aggregate(total=Sum("duration_minutes"))["total"]
            or 0
        )
        today_active_employees = (
            TimeEntry.objects.filter(employee__in=active_users, start_time__date=today).values("employee_id").distinct().count()
        )
        average_today_minutes = round(today_minutes / max(today_active_employees, 1)) if today_active_employees else 0

        current_week_hours = (
            TimesheetLine.objects.filter(timesheet__employee__in=active_users, date__gte=week_start, date__lte=today).aggregate(total=Sum("hours"))["total"]
            or Decimal("0")
        )
        previous_week_hours = (
            TimesheetLine.objects.filter(
                timesheet__employee__in=active_users,
                date__gte=previous_week_start,
                date__lte=previous_week_end,
            ).aggregate(total=Sum("hours"))["total"]
            or Decimal("0")
        )

        if previous_week_hours > 0:
            productivity_delta = round(((current_week_hours - previous_week_hours) / previous_week_hours) * 100)
        else:
            productivity_delta = 0

        payload = {
            "todayMinutes": average_today_minutes,
            "todayGoalPercent": min(max(round((average_today_minutes / 480) * 100) if average_today_minutes else 0, 0), 100),
            "teamMembers": active_users.count(),
            "weeklyProductivityDelta": productivity_delta,
        }
        return Response(payload)


class PublicCompleteSubscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data or {}
        required_fields = ["companyName", "fullName", "email", "planName", "billingCycle", "paymentMethod"]
        missing = [field for field in required_fields if not str(payload.get(field) or "").strip()]
        if missing:
            return Response({"detail": f"Missing required fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        invoice_context = _create_subscription_invoice_context(payload)
        _send_subscription_confirmation_email(invoice_context)
        return Response(
            {
                "message": "Subscription completed. Confirmation email with invoice sent.",
                "invoiceNumber": invoice_context["invoice_number"],
            },
            status=status.HTTP_201_CREATED,
        )


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
            "activePolicies": organization.policies.filter(enabled=True).count(),
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
        users = (
            User.objects.filter(organization=organization)
            .exclude(role=UserRole.TENANT)
            .select_related("department")
            .order_by("-date_joined")
        )
        return Response(TenantUserSerializer(users, many=True).data)

    def post(self, request):
        organization = _get_request_organization(request.user)
        try:
            user, delivery = _create_invited_user(request.data, organization=organization, invited_by=request.user)
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        _log_action(
            organization=organization,
            actor=request.user,
            action="Invited user",
            resource=user.email or user.username,
            details=f"{user.get_full_name() or user.username} was invited with {user.role} role.",
        )
        response_payload = TenantUserSerializer(user).data
        if delivery and delivery.get("delivery_mode") == "development":
            response_payload["invitation_url"] = delivery.get("invitation_url")
            response_payload["invite_message"] = "Email is not configured locally, so use the invite link below."
        return Response(response_payload, status=status.HTTP_201_CREATED)


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
            hourly_rate=_parse_decimal_amount(request.data.get("hourly_rate") or request.data.get("rate") or 0),
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
            rate.hourly_rate = _parse_decimal_amount(request.data.get("hourly_rate") or request.data.get("rate"))
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
            subscription.monthly_recurring_revenue = _parse_decimal_amount(
                request.data.get("monthly_recurring_revenue") or request.data.get("monthlyRevenue")
            )
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
            "billing_address": ["billing_address", "billingAddress"],
            "payment_methods": ["payment_methods", "paymentMethods"],
            "locations_count": ["locations_count"],
            "cost_centers_count": ["cost_centers_count"],
        }
        for field, keys in field_map.items():
            for key in keys:
                if key in request.data:
                    value = request.data[key]
                    if field == "max_hours" and isinstance(value, str):
                        value = int("".join(ch for ch in value if ch.isdigit()) or organization.max_hours)
                    if field == "billing_address" and not isinstance(value, dict):
                        value = organization.billing_address or {}
                    if field == "payment_methods" and not isinstance(value, list):
                        value = organization.payment_methods or []
                    setattr(organization, field, value)
                    break
        organization.save()

        profile_payload = request.data.get("adminProfile") or request.data.get("profile")
        if isinstance(profile_payload, dict):
            profile_user = _get_admin_profile_user(organization, request.user)
            if "name" in profile_payload:
                first_name, last_name = _split_name(profile_payload.get("name"))
                profile_user.first_name = first_name
                profile_user.last_name = last_name
            if "email" in profile_payload:
                profile_user.email = profile_payload.get("email") or profile_user.email
            profile_user.save()

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


class DashboardActivityEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        dashboard = str(request.data.get("dashboard") or "general").strip().lower()[:40]
        path = str(request.data.get("path") or "")[:255]
        event_type = str(request.data.get("event_type") or "activity").strip().lower()[:40]
        severity = str(request.data.get("severity") or "info").strip().lower()[:20]
        summary = str(request.data.get("summary") or "Dashboard activity").strip()[:180]
        details = str(request.data.get("details") or "").strip()
        duration_ms = request.data.get("duration_ms")
        metadata = request.data.get("metadata") if isinstance(request.data.get("metadata"), dict) else {}

        organization = getattr(request.user, "organization", None)
        log = DashboardActivityLog.objects.create(
            organization=organization,
            actor=request.user,
            actor_name=request.user.get_full_name() or request.user.username,
            actor_email=request.user.email or "",
            actor_role=getattr(request.user, "role", "") or "",
            dashboard=dashboard,
            path=path,
            event_type=event_type,
            severity=severity,
            summary=summary,
            details=details,
            duration_ms=int(duration_ms) if duration_ms not in (None, "") else None,
            metadata=metadata,
        )
        return Response({"id": log.id}, status=status.HTTP_201_CREATED)


class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        organizations = TenantOrganization.objects.all()
        subscriptions = TenantSubscription.objects.all()
        recent_events = DashboardActivityLog.objects.select_related("organization")[:6]
        issue_events = DashboardActivityLog.objects.filter(
            Q(severity__in=["high", "critical"]) | Q(event_type__in=["slow_request", "client_error", "request_error"])
        )
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
            "openPlatformIssues": issue_events.filter(created_at__gte=now - timedelta(days=7)).count(),
            "recentClients": TenantOrganizationSerializer(organizations[:5], many=True).data,
            "revenueData": revenue_by_month,
            "recentActivity": DashboardActivityLogSerializer(recent_events, many=True).data,
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
        now = timezone.now()
        recent_issues = DashboardActivityLog.objects.select_related("organization").filter(
            Q(severity__in=["high", "critical"]) | Q(event_type__in=["slow_request", "client_error", "request_error"])
        )[:10]
        recent_activity = DashboardActivityLog.objects.select_related("organization")[:10]
        return Response(
            {
                "api": "Operational",
                "database": "Connected",
                "organizations": TenantOrganization.objects.count(),
                "users": User.objects.count(),
                "activeSubscriptions": TenantSubscription.objects.filter(status="Active").count(),
                "issuesLast24h": DashboardActivityLog.objects.filter(
                    Q(severity__in=["high", "critical"]) | Q(event_type__in=["slow_request", "client_error", "request_error"]),
                    created_at__gte=now - timedelta(hours=24),
                ).count(),
                "slowRequestsLast24h": DashboardActivityLog.objects.filter(
                    event_type="slow_request",
                    created_at__gte=now - timedelta(hours=24),
                ).count(),
                "clientErrorsLast24h": DashboardActivityLog.objects.filter(
                    event_type="client_error",
                    created_at__gte=now - timedelta(hours=24),
                ).count(),
                "recentIssues": DashboardActivityLogSerializer(recent_issues, many=True).data,
                "recentActivity": DashboardActivityLogSerializer(recent_activity, many=True).data,
            }
        )


class AdminDashboardActivityView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        events = DashboardActivityLog.objects.select_related("organization")[:100]
        return Response(DashboardActivityLogSerializer(events, many=True).data)


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
        return _ensure_demo_tenant_setup(user.organization, user)
    if user.role in (UserRole.ADMIN, UserRole.TENANT):
        organization = TenantOrganization.objects.order_by("id").first()
        if organization is None:
            organization = TenantOrganization.objects.create(
                name="Acme Corporation",
                contact_email=user.email or "",
            )
            TenantSubscription.objects.get_or_create(
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
        user.organization = organization
        user.save(update_fields=["organization"])
        return _ensure_demo_tenant_setup(organization, user)
    raise ValidationError({"organization": "No tenant organization is linked to this user."})


def _resolve_organization(value, fallback=None):
    if value in (None, ""):
        return fallback
    return get_object_or_404(TenantOrganization, id=value)


def _resolve_org_user(organization, value):
    if value in (None, ""):
        return None
    text_value = str(value).strip()
    if text_value.isdigit():
        return get_object_or_404(User, id=text_value, organization=organization)

    user = (
        User.objects.filter(organization=organization)
        .filter(Q(email__iexact=text_value) | Q(username__iexact=text_value))
        .first()
    )
    if user:
        return user

    for candidate in User.objects.filter(organization=organization):
        if (candidate.get_full_name() or "").strip().lower() == text_value.lower():
            return candidate
    return None


def _parse_decimal_amount(value):
    if isinstance(value, Decimal):
        return value
    cleaned = "".join(ch for ch in str(value or "") if ch.isdigit() or ch == ".")
    return Decimal(cleaned or "0")


def _ensure_demo_tenant_setup(organization, fallback_user):
    has_meaningful_data = (
        organization.users.exclude(role=UserRole.TENANT).exists()
        or organization.departments.exists()
        or organization.policies.exists()
        or organization.billing_rates.exists()
        or organization.overtime_rules.exists()
    )
    if has_meaningful_data:
        return organization

    organization.contact_phone = organization.contact_phone or "+91 98765 43210"
    organization.footer_notes = organization.footer_notes or "Thank you for your business! Payment terms: Net 30 days."
    organization.locations_count = organization.locations_count or 8
    organization.cost_centers_count = organization.cost_centers_count or 24
    organization.save(
        update_fields=["contact_phone", "footer_notes", "locations_count", "cost_centers_count", "updated_at"]
    )

    departments = {}
    for name in ["Engineering", "Sales", "Marketing", "Finance", "HR", "Operations", "IT"]:
        departments[name], _ = Department.objects.get_or_create(
            organization=organization,
            name=name,
            defaults={"status": "Active"},
        )

    seeded_users = [
        {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@company.com",
            "role": UserRole.ADMIN,
            "status": "Active",
            "department": "Engineering",
        },
        {
            "name": "Michael Chen",
            "email": "michael.chen@company.com",
            "role": UserRole.MANAGER,
            "status": "Active",
            "department": "Sales",
        },
        {
            "name": "Emily Davis",
            "email": "emily.davis@company.com",
            "role": UserRole.EMPLOYEE,
            "status": "Active",
            "department": "Marketing",
        },
        {
            "name": "Robert Wilson",
            "email": "robert.wilson@company.com",
            "role": UserRole.EMPLOYEE,
            "status": "Active",
            "department": "Engineering",
        },
        {
            "name": "Jennifer Lee",
            "email": "jennifer.lee@company.com",
            "role": UserRole.MANAGER,
            "status": "Inactive",
            "department": "HR",
        },
        {
            "name": "David Martinez",
            "email": "david.martinez@company.com",
            "role": UserRole.EMPLOYEE,
            "status": "Active",
            "department": "Finance",
        },
        {
            "name": "Lisa Anderson",
            "email": "lisa.anderson@company.com",
            "role": UserRole.EMPLOYEE,
            "status": "Active",
            "department": "Operations",
        },
        {
            "name": "James Taylor",
            "email": "james.taylor@company.com",
            "role": UserRole.ADMIN,
            "status": "Active",
            "department": "IT",
        },
    ]

    created_users = {}
    for payload in seeded_users:
        user = User.objects.filter(email__iexact=payload["email"], organization=organization).first()
        if user is None:
            user = _create_or_update_user(
                {
                    "name": payload["name"],
                    "email": payload["email"],
                    "role": payload["role"],
                    "status": payload["status"],
                    "department": payload["department"],
                    "password": "Pass@12345",
                },
                organization=organization,
            )
        created_users[payload["name"]] = user

    department_heads = {
        "Engineering": "Sarah Johnson",
        "Sales": "Michael Chen",
        "Marketing": "Emily Davis",
        "Finance": "David Martinez",
    }
    for department_name, head_name in department_heads.items():
        department = departments[department_name]
        department.head = created_users.get(head_name)
        department.save(update_fields=["head"])

    subscription = _get_or_create_subscription(organization)
    subscription.plan_name = subscription.plan_name or "Enterprise"
    subscription.billing_cycle = subscription.billing_cycle or "Annual"
    subscription.licenses = max(subscription.licenses or 0, 500)
    subscription.monthly_recurring_revenue = subscription.monthly_recurring_revenue or Decimal("649.00")
    subscription.status = subscription.status or "Active"
    subscription.payment_status = subscription.payment_status or "Paid"
    subscription.renewal_date = subscription.renewal_date or (timezone.now().date() + timedelta(days=30))
    subscription.history = subscription.history or ["Subscription initialized"]
    subscription.save()

    policy_defaults = [
        (
            "Working Hours Policy",
            "Defines standard working hours, break times, and flexible work arrangements",
            "All departments",
            ["Standard shift 9:30 AM to 6:30 PM", "45-minute lunch break"],
        ),
        (
            "Approval Workflow Rules",
            "Multi-level approval process for timesheets, time-off requests, and overtime",
            "Managers & above",
            ["Manager approval is required first", "Exceptions require second-level review"],
        ),
        (
            "Access Control Policy",
            "Role-based access permissions for system features and data visibility",
            "All users",
            ["Employees can access their own records", "Managers can review their teams"],
        ),
        (
            "Time-off Policy",
            "Leave accrual, request, and approval policies for different leave types",
            "All employees",
            ["Leave requests should be submitted before absence", "Emergency leave can be regularized later"],
        ),
    ]
    for title, description, applies_to, details in policy_defaults:
        TenantPolicy.objects.get_or_create(
            organization=organization,
            title=title,
            defaults={
                "description": description,
                "applies_to": applies_to,
                "enabled": True,
                "details": details,
            },
        )

    billing_rate_defaults = [
        ("Software Engineer", "All Projects", Decimal("2500.00")),
        ("Senior Software Engineer", "All Projects", Decimal("3500.00")),
        ("Project Manager", "All Projects", Decimal("4000.00")),
        ("Designer", "Project Alpha", Decimal("2000.00")),
        ("QA Engineer", "All Projects", Decimal("1800.00")),
        ("DevOps Engineer", "Infrastructure", Decimal("3200.00")),
    ]
    for role, project_name, hourly_rate in billing_rate_defaults:
        TenantBillingRate.objects.get_or_create(
            organization=organization,
            role=role,
            project_name=project_name,
            defaults={"hourly_rate": hourly_rate, "rate_type": "Hourly", "is_active": True},
        )

    overtime_defaults = [
        ("Standard Overtime", "After 40 hours", "1.5x", "Hourly Staff"),
        ("Weekend Overtime", "Any hours", "2.0x", "All Employees"),
        ("Holiday Overtime", "Any hours", "2.5x", "All Employees"),
    ]
    for title, threshold, multiplier, applies_to in overtime_defaults:
        TenantOvertimeRule.objects.get_or_create(
            organization=organization,
            title=title,
            defaults={"threshold": threshold, "multiplier": multiplier, "applies_to": applies_to, "active": True},
        )

    TenantAuditLog.objects.get_or_create(
        organization=organization,
        action="Created user account",
        resource="john.doe@company.com",
        defaults={
            "actor": created_users.get("Sarah Johnson") or _get_admin_profile_user(organization, fallback_user),
            "actor_name": "Sarah Johnson",
            "actor_email": "sarah.johnson@company.com",
            "details": "New user John Doe was added to the Engineering department with Employee role.",
        },
    )

    return organization


def _build_admin_profile(organization, fallback_user):
    user = _get_admin_profile_user(organization, fallback_user)
    return {
        "name": user.get_full_name() or user.username,
        "role": "Tenant Admin" if user.role == UserRole.TENANT else user.role.title(),
        "email": user.email,
        "phone": organization.contact_phone,
    }


def _get_admin_profile_user(organization, fallback_user):
    return (
        User.objects.filter(organization=organization, role__in=[UserRole.TENANT, UserRole.ADMIN])
        .order_by("id")
        .first()
        or fallback_user
    )


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


def _generate_public_invoice_number():
    return f"INV-{timezone.now().strftime('%Y%m%d-%H%M%S')}"


def _safe_decimal(value, default="0"):
    try:
        cleaned = str(value or "").replace(",", "").strip()
        if not cleaned:
            return Decimal(default)
        return Decimal(cleaned)
    except Exception:
        return Decimal(default)


def _flatten_subscription_address(payload):
    return ", ".join(
        part
        for part in [
            payload.get("addressLine1"),
            payload.get("addressLine2"),
            ", ".join(part for part in [payload.get("city"), payload.get("state")] if part),
            " ".join(part for part in [payload.get("postalCode"), payload.get("country")] if part),
        ]
        if part
    )


def _slug_code(value, fallback="SUB"):
    slug = re.sub(r"[^A-Z0-9]+", "", str(value or "").upper())
    return (slug[:8] or fallback)


def _create_subscription_invoice_context(payload):
    issued_on = timezone.localdate()
    due_date = issued_on
    invoice_number = _generate_public_invoice_number()
    company_name = str(payload.get("companyName") or payload.get("fullName") or "Subscription Client").strip()
    customer_email = str(payload.get("email") or "").strip()
    customer_name = str(payload.get("fullName") or company_name).strip()
    address = _flatten_subscription_address(payload)
    country = str(payload.get("country") or "").strip()
    state = str(payload.get("state") or "").strip()
    billing_cycle = str(payload.get("billingCycle") or "Annual").strip()
    plan_name = str(payload.get("planName") or "Subscription").strip()
    region_label = str(payload.get("regionLabel") or payload.get("region") or "").strip()
    users = int(payload.get("users") or 1)
    total_display = str(payload.get("totalDisplay") or "Custom").strip()
    unit_price_display = str(payload.get("unitPriceDisplay") or total_display).strip()
    billing_period_label = str(payload.get("billingPeriodLabel") or "").strip()
    payment_method = str(payload.get("paymentMethod") or "").strip()
    card_last4 = str(payload.get("cardLast4") or "").strip()

    display_amount = _safe_decimal(payload.get("invoiceAmount"), "0")
    tax_amount = (display_amount * Decimal("0.10")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if display_amount > 0 else Decimal("0.00")
    total_amount = (display_amount + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    client, _ = Client.objects.get_or_create(
        email=customer_email or f"{_slug_code(company_name).lower()}@example.com",
        defaults={
            "name": company_name,
            "code": f"{_slug_code(company_name)}-{timezone.now().strftime('%H%M%S')}",
            "address": address,
            "state": state,
            "phone": str(payload.get("phone") or "").strip(),
        },
    )
    if company_name:
        client.name = company_name
    if address:
        client.address = address
    if state:
        client.state = state
    if payload.get("phone"):
        client.phone = str(payload.get("phone")).strip()
    client.save()

    invoice = Invoice.objects.create(
        invoice_number=invoice_number,
        client=client,
        financial_year=f"{issued_on.year}-{str(issued_on.year + 1)[-2:]}",
        client_address=address,
        client_state=state,
        supplier_name="Abhyaka ForTimesheet",
        supplier_address="123 Business Street, Suite 100, City, State 12345",
        supplier_state="Karnataka",
        issued_on=issued_on,
        due_date=due_date,
        status="Paid",
        group_by="manual",
        subtotal=display_amount,
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        igst=tax_amount,
        total_amount=total_amount,
        generated_from={"source": "public_subscription_checkout"},
    )
    InvoiceLineItem.objects.create(
        invoice=invoice,
        description=f"{plan_name} Plan Subscription for {billing_period_label or billing_cycle}",
        quantity=Decimal(str(users)),
        rate=display_amount if display_amount > 0 else Decimal("0.00"),
        tax_rate=Decimal("10.00") if display_amount > 0 else Decimal("0.00"),
        amount=display_amount,
        source_type=InvoiceLineItem.SourceType.MANUAL,
    )

    return {
        "invoice_number": invoice_number,
        "issued_on": issued_on.strftime("%B %d, %Y"),
        "due_date": due_date.strftime("%B %d, %Y"),
        "company_name": company_name,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "address": address,
        "country": country,
        "state": state,
        "billing_cycle": billing_cycle,
        "billing_period_label": billing_period_label or billing_cycle,
        "plan_name": plan_name,
        "region_label": region_label,
        "users": users,
        "total_display": total_display,
        "unit_price_display": unit_price_display,
        "payment_method": payment_method,
        "card_last4": card_last4,
        "subtotal": f"{display_amount:.2f}" if display_amount > 0 else total_display,
        "tax": f"{tax_amount:.2f}" if tax_amount > 0 else "0.00",
        "total_amount": f"{total_amount:.2f}" if total_amount > 0 else total_display,
        "invoice_id": invoice.id,
    }


def _pdf_escape(value):
    return str(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_invoice_pdf(invoice_context):
    lines = []

    def text(x, y, size, value):
        lines.append(f"BT /F1 {size} Tf {x} {y} Td ({_pdf_escape(value)}) Tj ET")

    lines.append("0.2 0.27 0.63 rg 40 1080 760 70 re f")
    lines.append("0.95 0.96 0.98 rg 40 730 760 320 re f")
    lines.append("0.85 0.88 0.93 RG 1 w 40 730 760 320 re S")
    text(55, 1125, 24, "INVOICE")
    text(540, 1125, 12, f"Invoice Number")
    text(540, 1105, 14, invoice_context["invoice_number"])

    text(55, 1060, 13, "From:")
    text(55, 1038, 16, "Abhyaka ForTimesheet")
    text(55, 1018, 12, "123 Business Street")
    text(55, 1000, 12, "Suite 100")
    text(55, 982, 12, "City, State 12345")
    text(55, 964, 12, "support@abhyakafortimesheet.com")

    text(430, 1060, 13, "Bill To:")
    text(430, 1038, 16, invoice_context["customer_name"])
    text(430, 1018, 12, invoice_context["customer_email"])
    for index, part in enumerate([p.strip() for p in invoice_context["address"].split(",") if p.strip()][:3]):
        text(430, 1000 - (index * 18), 12, part)

    text(55, 912, 12, f"Invoice Date: {invoice_context['issued_on']}")
    text(250, 912, 12, f"Due Date: {invoice_context['due_date']}")
    text(430, 912, 12, f"Billing Period: {invoice_context['billing_period_label']}")

    lines.append("0.18 0.22 0.32 rg 55 870 730 26 re f")
    text(65, 878, 11, "Description")
    text(515, 878, 11, "Quantity")
    text(605, 878, 11, "Unit Price")
    text(705, 878, 11, "Amount")

    description = f"{invoice_context['plan_name']} Plan Subscription for {invoice_context['billing_period_label']}"
    text(65, 840, 12, description)
    text(535, 840, 12, str(invoice_context["users"]))
    text(615, 840, 12, invoice_context["unit_price_display"])
    text(710, 840, 12, invoice_context["total_display"])

    text(560, 792, 12, "Subtotal:")
    text(710, 792, 12, invoice_context["subtotal"])
    text(560, 770, 12, "Tax:")
    text(710, 770, 12, invoice_context["tax"])
    text(560, 744, 14, "Total:")
    text(700, 744, 14, invoice_context["total_amount"])

    text(55, 690, 14, "Payment Information")
    payment_line = f"Payment has been processed automatically via your saved payment method."
    if invoice_context["card_last4"]:
        payment_line = f"Payment has been processed via {invoice_context['payment_method']} ending in {invoice_context['card_last4']}."
    text(55, 668, 12, payment_line)
    text(55, 644, 12, f"Thank you for your subscription to Abhyaka ForTimesheet.")

    text(55, 604, 14, "Terms & Conditions:")
    text(55, 582, 11, "Subscription renews automatically unless cancelled before the renewal date.")
    text(55, 564, 11, "For billing questions, contact support@abhyakafortimesheet.com.")

    content = "\n".join(lines).encode("latin-1", "replace")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        b"2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 841.92 1191.12] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(content)} >> stream\n".encode("latin-1") + content + b"\nendstream endobj",
    ]

    buffer = BytesIO()
    buffer.write(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(buffer.tell())
        buffer.write(obj + b"\n")
    xref_start = buffer.tell()
    buffer.write(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        buffer.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
    buffer.write(
        f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("latin-1")
    )
    return buffer.getvalue()


def _send_subscription_confirmation_email(invoice_context):
    subject = f"Your Abhyaka subscription is completed - {invoice_context['invoice_number']}"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or getattr(settings, "EMAIL_HOST_USER", "")
    recipient = invoice_context["customer_email"]
    if not recipient:
        raise RuntimeError("Customer email address is required to send the subscription invoice.")

    plain_body = (
        f"Hi {invoice_context['customer_name']},\n\n"
        f"Your subscription to Abhyaka has been completed successfully.\n"
        f"Plan: {invoice_context['plan_name']}\n"
        f"Billing cycle: {invoice_context['billing_cycle']}\n"
        f"Invoice number: {invoice_context['invoice_number']}\n\n"
        f"We have attached your invoice PDF to this email.\n\n"
        f"Thank you,\nAbhyaka"
    )
    html_body = f"""
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Your subscription is completed</h2>
        <p>Hi {invoice_context['customer_name']},</p>
        <p>Your subscription to <strong>Abhyaka</strong> has been completed successfully.</p>
        <p><strong>Plan:</strong> {invoice_context['plan_name']}<br />
        <strong>Billing cycle:</strong> {invoice_context['billing_cycle']}<br />
        <strong>Invoice number:</strong> {invoice_context['invoice_number']}</p>
        <p>Your invoice PDF is attached with this email.</p>
        <p>Thank you for subscribing to Abhyaka.</p>
      </div>
    """

    message = EmailMultiAlternatives(
        subject=subject,
        body=plain_body,
        from_email=from_email or "no-reply@abhyaka.local",
        to=[recipient],
    )
    message.attach_alternative(html_body, "text/html")
    message.attach(
        f"{invoice_context['invoice_number']}.pdf",
        _build_invoice_pdf(invoice_context),
        "application/pdf",
    )
    sent = message.send(fail_silently=False)
    if sent == 0:
        raise RuntimeError("Email delivery failed. Check SMTP configuration.")


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


@transaction.atomic
def _create_invited_user(payload, organization, invited_by):
    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise ValidationError({"email": "Email is required."})

    existing = User.objects.filter(email__iexact=email).first()
    if existing:
        if existing.organization_id == organization.id:
            raise ValidationError({"email": "A user with this email already exists in your organization."})
        raise ValidationError({"email": "A user with this email already exists."})

    pending_payload = {
        **payload,
        "email": email,
        "status": "Inactive",
        "is_active": False,
    }
    user = _create_or_update_user(pending_payload, organization=organization)
    user.set_unusable_password()
    user.is_active = False
    user.save(update_fields=["password", "is_active"])

    delivery = send_user_invitation_email(
        user=user,
        invited_by=invited_by,
        invited_by_name=invited_by.get_full_name() or invited_by.username,
    )
    return user, delivery


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
