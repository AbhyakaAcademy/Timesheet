from rest_framework import serializers

from accounts.models import User
from finance.models import (
    BillingRate,
    Client,
    EmployeeRateOverride,
    Expense,
    ExportJob,
    Invoice,
    InvoiceLineItem,
    OvertimeRule,
    Policy,
    ProjectFinanceProfile,
    ProjectRate,
    ProjectTask,
)
from timesheets.models import Project


class ClientSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "code",
            "gstin",
            "email",
            "phone",
            "address",
            "state",
            "active",
            "status",
            "projects",
        )
        extra_kwargs = {"code": {"required": False, "allow_blank": True}}

    def get_status(self, obj):
        return "Active" if obj.active else "Inactive"

    def get_projects(self, obj):
        return Project.objects.filter(client_name=obj.name).count()


class ProjectTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTask
        fields = ("id", "name", "code", "is_active")


class ProjectFinanceProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFinanceProfile
        fields = ("budget_hours", "budget_amount", "current_hours", "current_amount", "alert_threshold")


class FinanceProjectSerializer(serializers.ModelSerializer):
    client = serializers.CharField(source="client_name", read_only=True)
    status = serializers.SerializerMethodField()
    hours = serializers.SerializerMethodField()
    budget = serializers.SerializerMethodField()
    alertThreshold = serializers.SerializerMethodField()
    tasks = ProjectTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "code",
            "client",
            "client_name",
            "is_active",
            "status",
            "hours",
            "budget",
            "alertThreshold",
            "tasks",
        )

    def _profile(self, obj):
        return getattr(obj, "finance_profile", None)

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_hours(self, obj):
        profile = self._profile(obj)
        if profile is None:
            return {"current": 0, "total": 0}
        return {"current": float(profile.current_hours), "total": float(profile.budget_hours)}

    def get_budget(self, obj):
        profile = self._profile(obj)
        if profile is None:
            return {"current": 0, "total": 0}
        return {"current": float(profile.current_amount), "total": float(profile.budget_amount)}

    def get_alertThreshold(self, obj):
        profile = self._profile(obj)
        return profile.alert_threshold if profile is not None else 80


class ProjectRateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="project.name", read_only=True)
    projectName = serializers.CharField(source="project.name", read_only=True)
    rate = serializers.DecimalField(source="hourly_rate", max_digits=10, decimal_places=2, read_only=True)
    hourlyRate = serializers.DecimalField(source="hourly_rate", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProjectRate
        fields = (
            "id",
            "project",
            "name",
            "projectName",
            "rate",
            "hourly_rate",
            "hourlyRate",
            "currency",
            "is_active",
        )


class BillingRateSerializer(serializers.ModelSerializer):
    roleName = serializers.CharField(source="role", read_only=True)
    hourlyRate = serializers.DecimalField(source="hourly_rate", max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = BillingRate
        fields = ("id", "role", "roleName", "hourly_rate", "hourlyRate", "currency")


class EmployeeRateOverrideSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employeeName = serializers.SerializerMethodField()
    project_name = serializers.CharField(source="project.name", read_only=True)
    projectName = serializers.CharField(source="project.name", read_only=True)
    hourlyRate = serializers.DecimalField(source="hourly_rate", max_digits=10, decimal_places=2, read_only=True)
    overridesRole = serializers.CharField(source="overrides_role", read_only=True)

    class Meta:
        model = EmployeeRateOverride
        fields = (
            "id",
            "employee",
            "employee_name",
            "employeeName",
            "project",
            "project_name",
            "projectName",
            "overrides_role",
            "overridesRole",
            "hourly_rate",
            "hourlyRate",
            "currency",
            "is_active",
        )

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_employeeName(self, obj):
        return self.get_employee_name(obj)


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    sacHsn = serializers.CharField(source="sac_hsn", read_only=True)
    taxRate = serializers.DecimalField(source="tax_rate", max_digits=5, decimal_places=2, read_only=True)
    sourceType = serializers.CharField(source="source_type", read_only=True)
    sourceIds = serializers.JSONField(source="source_ids", read_only=True)

    class Meta:
        model = InvoiceLineItem
        fields = (
            "id",
            "description",
            "sac_hsn",
            "sacHsn",
            "quantity",
            "rate",
            "tax_rate",
            "taxRate",
            "amount",
            "source_type",
            "sourceType",
            "source_ids",
            "sourceIds",
        )


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    clientName = serializers.CharField(source="client.name", read_only=True)
    clientGSTIN = serializers.CharField(source="client_gstin", read_only=True)
    clientAddress = serializers.CharField(source="client_address", read_only=True)
    clientState = serializers.CharField(source="client_state", read_only=True)
    supplierName = serializers.CharField(source="supplier_name", read_only=True)
    supplierGSTIN = serializers.CharField(source="supplier_gstin", read_only=True)
    supplierAddress = serializers.CharField(source="supplier_address", read_only=True)
    supplierState = serializers.CharField(source="supplier_state", read_only=True)
    invoiceDate = serializers.DateField(source="issued_on", read_only=True)
    dueDate = serializers.DateField(source="due_date", read_only=True)
    invoiceNumber = serializers.CharField(source="invoice_number", read_only=True)
    financialYear = serializers.CharField(source="financial_year", read_only=True)
    groupBy = serializers.CharField(source="group_by", read_only=True)
    total = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)
    generatedFrom = serializers.JSONField(source="generated_from", read_only=True)
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    lineItems = InvoiceLineItemSerializer(source="line_items", many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "invoiceNumber",
            "financial_year",
            "financialYear",
            "client",
            "client_name",
            "clientName",
            "client_gstin",
            "clientGSTIN",
            "client_address",
            "clientAddress",
            "client_state",
            "clientState",
            "supplier_name",
            "supplierName",
            "supplier_gstin",
            "supplierGSTIN",
            "supplier_address",
            "supplierAddress",
            "supplier_state",
            "supplierState",
            "issued_on",
            "invoiceDate",
            "due_date",
            "dueDate",
            "status",
            "group_by",
            "groupBy",
            "subtotal",
            "cgst",
            "sgst",
            "igst",
            "total_amount",
            "total",
            "generated_from",
            "generatedFrom",
            "line_items",
            "lineItems",
        )


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ("id", "key", "title", "value")


class OvertimeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRule
        fields = ("id", "name", "threshold_hours", "multiplier", "is_active")


class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employeeName = serializers.SerializerMethodField()
    project_name = serializers.CharField(source="project.name", read_only=True)
    projectName = serializers.CharField(source="project.name", read_only=True)
    approved = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = (
            "id",
            "date",
            "employee",
            "employee_name",
            "employeeName",
            "project",
            "project_name",
            "projectName",
            "description",
            "amount",
            "billable",
            "status",
            "approved_by",
            "approved_at",
            "approved",
        )

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_employeeName(self, obj):
        return self.get_employee_name(obj)

    def get_approved(self, obj):
        return obj.status == "APPROVED"


class ExportJobSerializer(serializers.ModelSerializer):
    range = serializers.CharField(source="range_label", read_only=True)

    class Meta:
        model = ExportJob
        fields = ("id", "title", "range_label", "range", "format", "status", "file_url", "created_at")


class ProjectRateWriteSerializer(serializers.Serializer):
    project = serializers.IntegerField(required=False)
    projectName = serializers.CharField(required=False, allow_blank=True)
    hourlyRate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)


class BillingRateWriteSerializer(serializers.Serializer):
    role = serializers.CharField(required=False, allow_blank=True)
    roleName = serializers.CharField(required=False, allow_blank=True)
    hourlyRate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    currency = serializers.CharField(required=False, allow_blank=True)


class EmployeeRateOverrideWriteSerializer(serializers.Serializer):
    employee = serializers.IntegerField(required=False)
    employeeName = serializers.CharField(required=False, allow_blank=True)
    project = serializers.IntegerField(required=False)
    projectName = serializers.CharField(required=False, allow_blank=True)
    overridesRole = serializers.CharField(required=False, allow_blank=True)
    hourlyRate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)


class ExpenseWriteSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    employee = serializers.IntegerField(required=False)
    employeeName = serializers.CharField(required=False, allow_blank=True)
    project = serializers.IntegerField(required=False)
    projectName = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    billable = serializers.BooleanField(required=False)
    status = serializers.CharField(required=False, allow_blank=True)


def find_user_by_name(name):
    if not name:
        return None
    parts = [part for part in name.strip().split() if part]
    if len(parts) >= 2:
        user = User.objects.filter(first_name=parts[0], last_name=" ".join(parts[1:])).first()
        if user:
            return user
    return User.objects.filter(username=name).first()

