from rest_framework import serializers

from timesheets.models import (
    Project,
    ShiftType,
    TimeEntry,
    Timesheet,
    TimesheetApproval,
    TimesheetLine,
)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "code", "client_name", "is_active")


class TimeEntrySerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = TimeEntry
        fields = (
            "id",
            "employee",
            "project",
            "source",
            "start_time",
            "end_time",
            "duration_minutes",
            "note",
            "created_at",
        )
        read_only_fields = ("employee", "duration_minutes", "source")


class PunchInSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_project_id(self, value):
        if not Project.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Project not found or inactive.")
        return value


class PunchOutSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ManualTimeEntrySerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_project_id(self, value):
        if not Project.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Project not found or inactive.")
        return value

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("end_time must be after start_time.")
        return attrs


class TimesheetLineSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = TimesheetLine
        fields = (
            "id",
            "timesheet",
            "date",
            "project",
            "project_id",
            "description",
            "hours",
            "shift",
            "time_entry",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("timesheet",)

    def validate_project_id(self, value):
        if not Project.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Project not found or inactive.")
        return value

    def validate_hours(self, value):
        if value <= 0:
            raise serializers.ValidationError("Hours must be greater than 0.")
        if value > 24:
            raise serializers.ValidationError("Hours cannot exceed 24 in a single line.")
        return value

    def validate_shift(self, value):
        if value not in ShiftType.values:
            raise serializers.ValidationError("Invalid shift.")
        return value

    def update(self, instance, validated_data):
        project_id = validated_data.pop("project_id", None)
        if project_id is not None:
            instance.project = Project.objects.get(id=project_id)
        return super().update(instance, validated_data)


class TimesheetLineCreateSerializer(serializers.Serializer):
    date = serializers.DateField()
    project_id = serializers.IntegerField()
    description = serializers.CharField(required=False, allow_blank=True, max_length=255)
    hours = serializers.DecimalField(max_digits=5, decimal_places=2)
    shift = serializers.ChoiceField(choices=ShiftType.choices, default=ShiftType.DAY)
    time_entry_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_project_id(self, value):
        if not Project.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Project not found or inactive.")
        return value

    def validate_hours(self, value):
        if value <= 0 or value > 24:
            raise serializers.ValidationError("Hours must be between 0 and 24.")
        return value

    def validate_time_entry_id(self, value):
        if value is None:
            return value
        if not TimeEntry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Time entry not found.")
        return value


class TimesheetApprovalSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source="manager.get_full_name", read_only=True)
    manager_username = serializers.CharField(source="manager.username", read_only=True)

    class Meta:
        model = TimesheetApproval
        fields = ("id", "manager", "manager_username", "manager_name", "action", "comment", "acted_at")


class TimesheetSerializer(serializers.ModelSerializer):
    lines = TimesheetLineSerializer(many=True, read_only=True)
    approvals = TimesheetApprovalSerializer(many=True, read_only=True)
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = Timesheet
        fields = (
            "id",
            "employee",
            "week_start",
            "status",
            "submitted_at",
            "total_hours",
            "lines",
            "approvals",
        )

    def get_total_hours(self, obj):
        return float(sum(line.hours for line in obj.lines.all()))


class ManagerTimesheetListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.get_full_name", read_only=True)
    employee_username = serializers.CharField(source="employee.username", read_only=True)
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = Timesheet
        fields = ("id", "employee", "employee_username", "employee_name", "week_start", "status", "total_hours")

    def get_total_hours(self, obj):
        return float(sum(line.hours for line in obj.lines.all()))


class ApprovalActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, max_length=255)


class EmployeeDashboardSummarySerializer(serializers.Serializer):
    active_entry = serializers.DictField(allow_null=True)
    weekly_hours = serializers.FloatField()
    draft_count = serializers.IntegerField()
    submitted_count = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
