from django.conf import settings
from django.db import models
from django.utils import timezone


class Project(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class TeamMembership(models.Model):
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="managed_memberships",
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("manager", "employee")


class TimeEntrySource(models.TextChoices):
    PUNCH = "punch", "Punch"
    MANUAL = "manual", "Manual"


class TimesheetStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class ShiftType(models.TextChoices):
    DAY = "DAY", "Day"
    EVENING = "EVENING", "Evening"
    NIGHT = "NIGHT", "Night"


class TimeEntry(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="time_entries",
    )
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="time_entries")
    source = models.CharField(max_length=10, choices=TimeEntrySource.choices)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_duration(self):
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = max(int(delta.total_seconds() // 60), 0)
        return self.duration_minutes


class Timesheet(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timesheets",
    )
    week_start = models.DateField()
    status = models.CharField(max_length=20, choices=TimesheetStatus.choices, default=TimesheetStatus.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-week_start", "-created_at")

    def submit(self):
        self.status = TimesheetStatus.SUBMITTED
        self.submitted_at = timezone.now()
        self.save(update_fields=["status", "submitted_at", "updated_at"])


class TimesheetLine(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="lines")
    date = models.DateField()
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="timesheet_lines")
    description = models.CharField(max_length=255, blank=True)
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    shift = models.CharField(max_length=20, choices=ShiftType.choices, default=ShiftType.DAY)
    time_entry = models.ForeignKey(
        TimeEntry,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="timesheet_lines",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("date", "id")


class TimesheetAttachment(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timesheet_attachments",
    )
    file = models.FileField(upload_to="timesheet_attachments/%Y/%m/%d/")
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-uploaded_at",)


class ApprovalAction(models.TextChoices):
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class TimesheetApproval(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="approvals")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_actions",
    )
    action = models.CharField(max_length=20, choices=ApprovalAction.choices)
    comment = models.CharField(max_length=255, blank=True)
    acted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-acted_at",)


class ManualEntryRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class ManualEntryRequest(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="manual_entry_requests",
    )
    request_type = models.CharField(max_length=120)
    request_date = models.DateField()
    comment = models.TextField()
    status = models.CharField(max_length=20, choices=ManualEntryRequestStatus.choices, default=ManualEntryRequestStatus.PENDING)
    manager_comment = models.CharField(max_length=255, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_manual_entry_requests",
    )
    approved_entry = models.ForeignKey(
        TimeEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="manual_entry_requests",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
