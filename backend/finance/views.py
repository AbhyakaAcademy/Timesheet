from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsFinanceOrAdmin
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
from finance.serializers import (
    BillingRateSerializer,
    BillingRateWriteSerializer,
    ClientSerializer,
    EmployeeRateOverrideSerializer,
    EmployeeRateOverrideWriteSerializer,
    ExpenseSerializer,
    ExpenseWriteSerializer,
    ExportJobSerializer,
    FinanceProjectSerializer,
    InvoiceSerializer,
    OvertimeRuleSerializer,
    PolicySerializer,
    ProjectRateSerializer,
    ProjectRateWriteSerializer,
    find_user_by_name,
)
from timesheets.models import Project, TimesheetLine, TimesheetStatus


class FinanceClientsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = Client.objects.all().order_by("name")
        return Response(ClientSerializer(queryset, many=True).data)

    def post(self, request):
        payload = request.data.copy()
        if not payload.get("code"):
            payload["code"] = _generate_client_code(payload.get("name", ""))
        serializer = ClientSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)


class FinanceClientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request, client_id):
        client = get_object_or_404(Client, id=client_id)
        return Response(ClientSerializer(client).data)

    def patch(self, request, client_id):
        client = get_object_or_404(Client, id=client_id)
        serializer = ClientSerializer(client, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ClientSerializer(client).data)

    def delete(self, request, client_id):
        client = get_object_or_404(Client, id=client_id)
        client.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceProjectsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = Project.objects.select_related("finance_profile").prefetch_related("tasks").all().order_by("name")
        return Response(FinanceProjectSerializer(queryset, many=True).data)

    def post(self, request):
        payload = request.data
        project = _create_project_from_payload(payload)
        return Response(FinanceProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class FinanceProjectDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request, project_id):
        project = _get_finance_project(project_id)
        return Response(FinanceProjectSerializer(project).data)

    def patch(self, request, project_id):
        project = _get_finance_project(project_id)
        _update_project_from_payload(project, request.data)
        return Response(FinanceProjectSerializer(_get_finance_project(project.id)).data)

    def delete(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceInvoicesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = Invoice.objects.select_related("client").prefetch_related("line_items").all()
        return Response(InvoiceSerializer(queryset, many=True).data)

    def post(self, request):
        invoice = _save_invoice_from_payload(request.data)
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class FinanceInvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request, invoice_id):
        invoice = _get_invoice(invoice_id)
        return Response(InvoiceSerializer(invoice).data)

    def patch(self, request, invoice_id):
        invoice = _save_invoice_from_payload(request.data, invoice=_get_invoice(invoice_id))
        return Response(InvoiceSerializer(invoice).data)

    def delete(self, request, invoice_id):
        invoice = get_object_or_404(Invoice, id=invoice_id)
        invoice.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceProjectRatesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = ProjectRate.objects.select_related("project").all().order_by("project__name")
        return Response(ProjectRateSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = ProjectRateWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = _resolve_project_from_payload(serializer.validated_data)
        rate = ProjectRate.objects.create(
            project=project,
            hourly_rate=serializer.validated_data.get("hourlyRate", Decimal("0")),
            currency=serializer.validated_data.get("currency") or "INR",
            is_active=serializer.validated_data.get("is_active", True),
        )
        return Response(ProjectRateSerializer(rate).data, status=status.HTTP_201_CREATED)


class FinanceProjectRateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def patch(self, request, rate_id):
        rate = get_object_or_404(ProjectRate, id=rate_id)
        serializer = ProjectRateWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "project" in data or "projectName" in data:
            rate.project = _resolve_project_from_payload(data)
        if "hourlyRate" in data:
            rate.hourly_rate = data["hourlyRate"]
        if "currency" in data:
            rate.currency = data["currency"] or rate.currency
        if "is_active" in data:
            rate.is_active = data["is_active"]
        rate.save()
        return Response(ProjectRateSerializer(rate).data)

    def delete(self, request, rate_id):
        rate = get_object_or_404(ProjectRate, id=rate_id)
        rate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceRoleRatesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = BillingRate.objects.all().order_by("role")
        return Response(BillingRateSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = BillingRateWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        role_value = data.get("roleName") or data.get("role") or ""
        rate = BillingRate.objects.create(
            role=role_value,
            hourly_rate=data.get("hourlyRate", Decimal("0")),
            currency=data.get("currency") or "INR",
        )
        return Response(BillingRateSerializer(rate).data, status=status.HTTP_201_CREATED)


class FinanceRoleRateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def patch(self, request, rate_id):
        rate = get_object_or_404(BillingRate, id=rate_id)
        serializer = BillingRateWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "roleName" in data or "role" in data:
            rate.role = data.get("roleName") or data.get("role") or rate.role
        if "hourlyRate" in data:
            rate.hourly_rate = data["hourlyRate"]
        if "currency" in data:
            rate.currency = data["currency"] or rate.currency
        rate.save()
        return Response(BillingRateSerializer(rate).data)

    def delete(self, request, rate_id):
        rate = get_object_or_404(BillingRate, id=rate_id)
        rate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceEmployeeRatesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = EmployeeRateOverride.objects.select_related("employee", "project").all().order_by("employee__username")
        return Response(EmployeeRateOverrideSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = EmployeeRateOverrideWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        override = EmployeeRateOverride.objects.create(
            employee=_resolve_employee_from_payload(data),
            project=_resolve_project_from_payload(data),
            overrides_role=data.get("overridesRole", ""),
            hourly_rate=data.get("hourlyRate", Decimal("0")),
            currency=data.get("currency") or "INR",
            is_active=data.get("is_active", True),
        )
        return Response(EmployeeRateOverrideSerializer(override).data, status=status.HTTP_201_CREATED)


class FinanceEmployeeRateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def patch(self, request, rate_id):
        override = get_object_or_404(EmployeeRateOverride, id=rate_id)
        serializer = EmployeeRateOverrideWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "employee" in data or "employeeName" in data:
            override.employee = _resolve_employee_from_payload(data)
        if "project" in data or "projectName" in data:
            override.project = _resolve_project_from_payload(data)
        if "overridesRole" in data:
            override.overrides_role = data["overridesRole"]
        if "hourlyRate" in data:
            override.hourly_rate = data["hourlyRate"]
        if "currency" in data:
            override.currency = data["currency"] or override.currency
        if "is_active" in data:
            override.is_active = data["is_active"]
        override.save()
        return Response(EmployeeRateOverrideSerializer(override).data)

    def delete(self, request, rate_id):
        override = get_object_or_404(EmployeeRateOverride, id=rate_id)
        override.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceApprovedTimeEntriesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        lines = (
            TimesheetLine.objects.select_related("timesheet__employee", "project")
            .filter(timesheet__status=TimesheetStatus.APPROVED)
            .order_by("-date", "-id")
        )
        results = []
        for line in lines:
            employee = line.timesheet.employee
            rate = _resolve_rate(employee, line.project)
            hours = Decimal(line.hours)
            amount = hours * rate
            employee_name = employee.get_full_name() or employee.username
            project_name = line.project.name
            task_name = line.description or "General"
            results.append(
                {
                    "id": line.id,
                    "date": line.date,
                    "employee_name": employee_name,
                    "employeeName": employee_name,
                    "project_name": project_name,
                    "projectName": project_name,
                    "task_name": task_name,
                    "taskName": task_name,
                    "hours": float(hours),
                    "rate": float(rate),
                    "billable": True,
                    "approved": True,
                    "amount": float(amount),
                }
            )
        return Response(results)


class FinanceExpensesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = Expense.objects.select_related("employee", "project").all().order_by("-date", "-id")
        return Response(ExpenseSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = ExpenseWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = _save_expense_from_payload(serializer.validated_data)
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class FinanceExpenseDetailView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def patch(self, request, expense_id):
        serializer = ExpenseWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        expense = _save_expense_from_payload(serializer.validated_data, expense=get_object_or_404(Expense, id=expense_id))
        return Response(ExpenseSerializer(expense).data)

    def delete(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FinanceExpenseApproveView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def post(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        expense.status = ExpenseStatus.APPROVED
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save(update_fields=["status", "approved_by", "approved_at"])
        return Response(ExpenseSerializer(expense).data)


class FinanceExpenseRejectView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def post(self, request, expense_id):
        expense = get_object_or_404(Expense, id=expense_id)
        expense.status = ExpenseStatus.REJECTED
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save(update_fields=["status", "approved_by", "approved_at"])
        return Response(ExpenseSerializer(expense).data)


class FinanceExportsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        queryset = ExportJob.objects.all().order_by("-created_at")
        return Response(ExportJobSerializer(queryset, many=True).data)

    def post(self, request):
        title = request.data.get("title", "")
        range_label = request.data.get("range_label") or request.data.get("range") or ""
        export_format = request.data.get("format", "")
        export_job = ExportJob.objects.create(
            title=title,
            range_label=range_label,
            format=export_format,
            status=ExportStatus.READY,
            file_url=request.data.get("file_url", ""),
            created_by=request.user,
        )
        return Response(ExportJobSerializer(export_job).data, status=status.HTTP_201_CREATED)


class FinanceExportDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request, export_id):
        export_job = get_object_or_404(ExportJob, id=export_id)
        return Response(ExportJobSerializer(export_job).data)


class AdminPoliciesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(PolicySerializer(Policy.objects.all(), many=True).data)


class AdminOvertimeRulesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(OvertimeRuleSerializer(OvertimeRule.objects.all(), many=True).data)


class AdminBillingRatesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(BillingRateSerializer(BillingRate.objects.all(), many=True).data)


def _get_finance_project(project_id):
    return get_object_or_404(Project.objects.select_related("finance_profile").prefetch_related("tasks"), id=project_id)


@transaction.atomic
def _create_project_from_payload(payload):
    client_name = payload.get("client_name") or payload.get("client") or ""
    project = Project.objects.create(
        name=payload.get("name", ""),
        code=payload.get("code") or _generate_project_code(payload.get("name", "")),
        client_name=client_name,
        is_active=payload.get("is_active", True),
    )
    _save_project_profile(project, payload)
    _replace_project_tasks(project, payload.get("tasks") or [])
    return _get_finance_project(project.id)


@transaction.atomic
def _update_project_from_payload(project, payload):
    if "name" in payload:
        project.name = payload["name"]
    if "code" in payload:
        project.code = payload["code"] or _generate_project_code(project.name)
    if "client_name" in payload or "client" in payload:
        project.client_name = payload.get("client_name") or payload.get("client") or ""
    if "is_active" in payload:
        project.is_active = payload["is_active"]
    project.save()
    _save_project_profile(project, payload)
    if "tasks" in payload:
        _replace_project_tasks(project, payload.get("tasks") or [])
    return project


def _save_project_profile(project, payload):
    profile, _ = ProjectFinanceProfile.objects.get_or_create(project=project)
    field_map = {
        "budget_hours": ["budget_hours", "budgetHours"],
        "budget_amount": ["budget_amount", "budgetAmount"],
        "current_hours": ["current_hours"],
        "current_amount": ["current_amount"],
        "alert_threshold": ["alert_threshold", "alertThreshold"],
    }
    for field, keys in field_map.items():
        for key in keys:
            if key in payload:
                setattr(profile, field, payload[key] or 0)
                break
    profile.save()


def _replace_project_tasks(project, tasks):
    ProjectTask.objects.filter(project=project).delete()
    for task in tasks:
        ProjectTask.objects.create(
            project=project,
            name=task.get("name", ""),
            code=task.get("code", ""),
            is_active=task.get("is_active", True),
        )


def _get_invoice(invoice_id):
    return get_object_or_404(Invoice.objects.select_related("client").prefetch_related("line_items"), id=invoice_id)


@transaction.atomic
def _save_invoice_from_payload(payload, invoice=None):
    client = _resolve_client_for_invoice(payload, invoice.client if invoice else None)
    financial_year = payload.get("financial_year") or payload.get("financialYear") or getattr(invoice, "financial_year", "")
    invoice_number = payload.get("invoice_number") or payload.get("invoiceNumber")
    if not invoice_number:
        invoice_number = getattr(invoice, "invoice_number", "") or _generate_invoice_number(financial_year)

    if invoice is None:
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            client=client,
            financial_year=financial_year,
            client_gstin="",
            client_address="",
            client_state="",
            supplier_name="",
            supplier_gstin="",
            supplier_address="",
            supplier_state="",
            issued_on=timezone.now().date(),
            total_amount=Decimal("0"),
        )

    invoice.client = client
    invoice.invoice_number = invoice_number
    invoice.financial_year = financial_year
    invoice.client_gstin = payload.get("client_gstin", payload.get("clientGSTIN", invoice.client_gstin))
    invoice.client_address = payload.get("client_address", payload.get("clientAddress", invoice.client_address))
    invoice.client_state = payload.get("client_state", payload.get("clientState", invoice.client_state))
    invoice.supplier_name = payload.get("supplier_name", payload.get("supplierName", invoice.supplier_name))
    invoice.supplier_gstin = payload.get("supplier_gstin", payload.get("supplierGSTIN", invoice.supplier_gstin))
    invoice.supplier_address = payload.get("supplier_address", payload.get("supplierAddress", invoice.supplier_address))
    invoice.supplier_state = payload.get("supplier_state", payload.get("supplierState", invoice.supplier_state))
    invoice.issued_on = _parse_date(
        payload.get("issued_on", payload.get("invoice_date", payload.get("invoiceDate", invoice.issued_on)))
    ) or invoice.issued_on
    invoice.due_date = _parse_date(payload.get("due_date", payload.get("dueDate", invoice.due_date)))
    invoice.status = payload.get("status", invoice.status or "Draft")
    invoice.group_by = payload.get("group_by", payload.get("groupBy", invoice.group_by or "project"))
    invoice.generated_from = payload.get("generated_from", payload.get("generatedFrom", invoice.generated_from or {})) or {}
    invoice.save()

    if invoice.pk and ("line_items" in payload or "lineItems" in payload or invoice.line_items.count() == 0):
        InvoiceLineItem.objects.filter(invoice=invoice).delete()
        items = payload.get("line_items") or payload.get("lineItems") or []
        for item in _normalize_line_items(items):
            InvoiceLineItem.objects.create(invoice=invoice, **item)

    _apply_invoice_totals(invoice)
    return _get_invoice(invoice.id)


def _resolve_client_for_invoice(payload, existing_client=None):
    client_id = payload.get("client")
    if client_id:
        return get_object_or_404(Client, id=client_id)

    name = payload.get("client_name") or payload.get("clientName")
    if not name:
        if existing_client is not None:
            return existing_client
        raise ValidationError({"clientName": "Client name is required."})

    defaults = {
        "code": _generate_client_code(name),
        "gstin": payload.get("client_gstin", payload.get("clientGSTIN", "")),
        "address": payload.get("client_address", payload.get("clientAddress", "")),
        "state": payload.get("client_state", payload.get("clientState", "")),
    }
    client, _ = Client.objects.get_or_create(name=name, defaults=defaults)
    return client


def _resolve_project_from_payload(data):
    project_id = data.get("project")
    if project_id:
        return get_object_or_404(Project, id=project_id)
    project_name = data.get("projectName")
    project = Project.objects.filter(name=project_name).first()
    if project is None:
        raise ValidationError({"projectName": "Project is required."})
    return project


def _resolve_employee_from_payload(data):
    employee_id = data.get("employee")
    if employee_id:
        from accounts.models import User

        return get_object_or_404(User, id=employee_id)
    employee = find_user_by_name(data.get("employeeName"))
    if employee is None:
        raise ValidationError({"employeeName": "Employee is required."})
    return employee


def _save_expense_from_payload(data, expense=None):
    if expense is None:
        expense = Expense()
    if "date" in data:
        expense.date = data["date"]
    elif expense.pk is None:
        expense.date = timezone.now().date()
    if "employee" in data or "employeeName" in data or expense.pk is None:
        expense.employee = _resolve_employee_from_payload(data)
    if "project" in data or "projectName" in data or expense.pk is None:
        expense.project = _resolve_project_from_payload(data)
    if "description" in data:
        expense.description = data["description"]
    if "amount" in data:
        expense.amount = data["amount"]
    if "billable" in data:
        expense.billable = data["billable"]
    if "status" in data:
        expense.status = data["status"]
    elif expense.pk is None:
        expense.status = ExpenseStatus.PENDING
    expense.save()
    return expense


def _resolve_rate(employee, project):
    override = (
        EmployeeRateOverride.objects.filter(employee=employee, project=project, is_active=True)
        .order_by("-id")
        .first()
    )
    if override:
        return Decimal(override.hourly_rate)

    project_rate = ProjectRate.objects.filter(project=project, is_active=True).order_by("-id").first()
    if project_rate:
        return Decimal(project_rate.hourly_rate)

    role_rate = BillingRate.objects.filter(role=employee.role).order_by("-id").first()
    if role_rate:
        return Decimal(role_rate.hourly_rate)

    return Decimal("0")


def _normalize_line_items(items):
    normalized = []
    for item in items:
        quantity = Decimal(str(item.get("quantity") or 0))
        rate = Decimal(str(item.get("rate") or 0))
        tax_rate = Decimal(str(item.get("tax_rate") or item.get("taxRate") or 0))
        amount = item.get("amount")
        if amount in (None, ""):
            amount = quantity * rate
        normalized.append(
            {
                "description": item.get("description", ""),
                "sac_hsn": item.get("sac_hsn", item.get("sacHsn", "")),
                "quantity": quantity,
                "rate": rate,
                "tax_rate": tax_rate,
                "amount": Decimal(str(amount)),
                "source_type": item.get("source_type", item.get("sourceType", "manual")),
                "source_ids": item.get("source_ids", item.get("sourceIds", [])) or [],
            }
        )
    return normalized


def _apply_invoice_totals(invoice):
    items = invoice.line_items.all()
    subtotal = sum((item.amount for item in items), Decimal("0"))
    tax_amount = sum((item.amount * (item.tax_rate / Decimal("100")) for item in items), Decimal("0"))
    interstate = invoice.supplier_state and invoice.client_state and invoice.supplier_state != invoice.client_state
    if interstate:
        cgst = Decimal("0")
        sgst = Decimal("0")
        igst = tax_amount
    else:
        cgst = tax_amount / 2
        sgst = tax_amount / 2
        igst = Decimal("0")
    invoice.subtotal = subtotal
    invoice.cgst = cgst
    invoice.sgst = sgst
    invoice.igst = igst
    invoice.total_amount = subtotal + cgst + sgst + igst
    invoice.save(update_fields=["subtotal", "cgst", "sgst", "igst", "total_amount"])


def _generate_invoice_number(financial_year):
    year_prefix = financial_year.split("-")[0] if financial_year else "INV"
    count = Invoice.objects.filter(financial_year=financial_year).count() + 1
    return f"INV-{year_prefix}-{str(count).zfill(3)}"


def _generate_client_code(name):
    base = "".join(ch for ch in name.upper() if ch.isalnum())[:6] or "CLIENT"
    count = Client.objects.filter(code__startswith=base).count() + 1
    return f"{base}-{str(count).zfill(3)}"


def _generate_project_code(name):
    base = "".join(ch for ch in name.upper() if ch.isalnum())[:6] or "PRJ"
    count = Project.objects.filter(code__startswith=base).count() + 1
    return f"{base}-{str(count).zfill(3)}"


def _parse_date(value):
    if not value:
        return None
    if hasattr(value, "year"):
        return value
    return parse_date(str(value))
