from datetime import timedelta

from django.db import IntegrityError
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsEmployee, IsManagerOrAdmin
from notifications.models import Notification
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
from timesheets.serializers import (
    ApprovalActionSerializer,
    EmployeeDashboardSummarySerializer,
    ManualTimeEntrySerializer,
    ManagerTimesheetListSerializer,
    ProjectSerializer,
    PunchInSerializer,
    PunchOutSerializer,
    TimeEntrySerializer,
    TimesheetLineCreateSerializer,
    TimesheetLineSerializer,
    TimesheetSerializer,
)


def week_start_for(dt):
    return (dt - timedelta(days=dt.weekday())).date()


def manager_has_employee(manager, employee_id):
    return TeamMembership.objects.filter(manager=manager, employee_id=employee_id).exists()


def employee_display_name(employee):
    return employee.get_full_name().strip() or employee.username


def notify_employee_managers(employee, title, message):
    managers = [
        member.manager
        for member in TeamMembership.objects.select_related("manager").filter(employee=employee)
    ]
    for manager in managers:
        Notification.objects.create(
            recipient=manager,
            title=title,
            message=message,
        )


class EmployeeDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        now = timezone.now()
        week_start = week_start_for(now)
        user = request.user
        active_entry = (
            TimeEntry.objects.filter(employee=user, source=TimeEntrySource.PUNCH, end_time__isnull=True)
            .order_by("-start_time")
            .first()
        )
        weekly_hours = (
            TimesheetLine.objects.filter(timesheet__employee=user, timesheet__week_start=week_start).aggregate(
                total=Sum("hours")
            )["total"]
            or 0
        )
        summary = {
            "active_entry": TimeEntrySerializer(active_entry).data if active_entry else None,
            "weekly_hours": float(weekly_hours),
            "draft_count": Timesheet.objects.filter(employee=user, status=TimesheetStatus.DRAFT).count(),
            "submitted_count": Timesheet.objects.filter(employee=user, status=TimesheetStatus.SUBMITTED).count(),
            "approved_count": Timesheet.objects.filter(employee=user, status=TimesheetStatus.APPROVED).count(),
            "unread_notifications": Notification.objects.filter(recipient=user, is_read=False).count(),
        }
        return Response(EmployeeDashboardSummarySerializer(summary).data)


class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Project.objects.filter(is_active=True).order_by("name")
        return Response(ProjectSerializer(queryset, many=True).data)


class PunchInView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request):
        serializer = PunchInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        has_open_entry = TimeEntry.objects.filter(
            employee=request.user,
            source=TimeEntrySource.PUNCH,
            end_time__isnull=True,
        ).exists()
        if has_open_entry:
            return Response(
                {"detail": "You already have an active punch entry."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = Project.objects.get(id=serializer.validated_data["project_id"])
        entry = TimeEntry.objects.create(
            employee=request.user,
            project=project,
            source=TimeEntrySource.PUNCH,
            start_time=timezone.now(),
            note=serializer.validated_data.get("note", ""),
        )
        notify_employee_managers(
            request.user,
            "Employee punched in",
            f"{employee_display_name(request.user)} punched in for {project.name}.",
        )
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class PunchOutView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request, entry_id):
        serializer = PunchOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = get_object_or_404(TimeEntry, id=entry_id, employee=request.user, source=TimeEntrySource.PUNCH)
        if entry.end_time is not None:
            return Response({"detail": "Entry already punched out."}, status=status.HTTP_400_BAD_REQUEST)
        entry.end_time = timezone.now()
        if serializer.validated_data.get("note"):
            entry.note = serializer.validated_data["note"]
        entry.calculate_duration()
        entry.save(update_fields=["end_time", "note", "duration_minutes", "updated_at"])
        notify_employee_managers(
            request.user,
            "Employee punched out",
            (
                f"{employee_display_name(request.user)} punched out from {entry.project.name} "
                f"after {entry.duration_minutes} minutes."
            ),
        )
        return Response(TimeEntrySerializer(entry).data)


class ManualTimeEntryView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request):
        serializer = ManualTimeEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = Project.objects.get(id=serializer.validated_data["project_id"])
        entry = TimeEntry.objects.create(
            employee=request.user,
            project=project,
            source=TimeEntrySource.MANUAL,
            start_time=serializer.validated_data["start_time"],
            end_time=serializer.validated_data["end_time"],
            note=serializer.validated_data.get("note", ""),
        )
        entry.calculate_duration()
        entry.save(update_fields=["duration_minutes", "updated_at"])
        notify_employee_managers(
            request.user,
            "Manual time entry added",
            (
                f"{employee_display_name(request.user)} added a manual time entry for "
                f"{project.name} ({entry.duration_minutes} minutes)."
            ),
        )
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class CurrentTimesheetView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        current_week_start = week_start_for(timezone.now())
        week_timesheets = Timesheet.objects.filter(
            employee=request.user,
            week_start=current_week_start,
        ).order_by("-created_at")

        timesheet = week_timesheets.filter(status=TimesheetStatus.DRAFT).first()
        if timesheet is None:
            timesheet = week_timesheets.first()

        if timesheet is None:
            try:
                timesheet = Timesheet.objects.create(
                    employee=request.user,
                    week_start=current_week_start,
                    status=TimesheetStatus.DRAFT,
                )
            except IntegrityError:
                # Backward-compatible fallback when unique(employee, week_start)
                # still exists in DB before migration is applied.
                timesheet = (
                    Timesheet.objects.filter(
                        employee=request.user,
                        week_start=current_week_start,
                    )
                    .order_by("-created_at")
                    .first()
                )
        return Response(TimesheetSerializer(timesheet).data)


class EmployeeTimesheetListView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        queryset = (
            Timesheet.objects.filter(employee=request.user)
            .prefetch_related("lines", "approvals")
            .order_by("-week_start", "-created_at")
        )
        return Response(TimesheetSerializer(queryset, many=True).data)


class TimesheetLineDetailView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get_object(self, request, line_id):
        line = get_object_or_404(TimesheetLine, id=line_id, timesheet__employee=request.user)
        if line.timesheet.status != TimesheetStatus.DRAFT:
            return None, Response(
                {"detail": "Timesheet lines can only be modified in DRAFT status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return line, None

    def patch(self, request, line_id):
        line, error = self.get_object(request, line_id)
        if error:
            return error
        serializer = TimesheetLineSerializer(line, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_line = serializer.save()
        notify_employee_managers(
            request.user,
            "Timesheet entry updated",
            (
                f"{employee_display_name(request.user)} updated a timesheet entry for "
                f"{updated_line.project.name} on {updated_line.date}."
            ),
        )
        return Response(serializer.data)

    def delete(self, request, line_id):
        line, error = self.get_object(request, line_id)
        if error:
            return error
        project_name = line.project.name
        line_date = line.date
        line.delete()
        notify_employee_managers(
            request.user,
            "Timesheet entry deleted",
            f"{employee_display_name(request.user)} deleted a timesheet entry for {project_name} on {line_date}.",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddTimesheetLineView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request, timesheet_id):
        timesheet = get_object_or_404(Timesheet, id=timesheet_id, employee=request.user)
        if timesheet.status != TimesheetStatus.DRAFT:
            try:
                timesheet = Timesheet.objects.create(
                    employee=request.user,
                    week_start=timesheet.week_start,
                    status=TimesheetStatus.DRAFT,
                )
            except IntegrityError:
                # Backward-compatible fallback if unique(employee, week_start)
                # is still active before migration.
                existing_draft = (
                    Timesheet.objects.filter(
                        employee=request.user,
                        week_start=timesheet.week_start,
                        status=TimesheetStatus.DRAFT,
                    )
                    .order_by("-created_at")
                    .first()
                )
                if existing_draft is None:
                    return Response(
                        {
                            "detail": (
                                "Cannot create a new DRAFT timesheet for this week. "
                                "Run migrations to allow multiple timesheets per week."
                            )
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                timesheet = existing_draft

        serializer = TimesheetLineCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        line = TimesheetLine.objects.create(
            timesheet=timesheet,
            date=payload["date"],
            project_id=payload["project_id"],
            description=payload.get("description", ""),
            hours=payload["hours"],
            shift=payload.get("shift"),
            time_entry_id=payload.get("time_entry_id"),
        )
        notify_employee_managers(
            request.user,
            "Timesheet entry added",
            (
                f"{employee_display_name(request.user)} added {line.hours} hours "
                f"for {line.project.name} on {line.date}."
            ),
        )
        return Response(TimesheetLineSerializer(line).data, status=status.HTTP_201_CREATED)


class SubmitTimesheetView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def post(self, request, timesheet_id):
        timesheet = get_object_or_404(Timesheet, id=timesheet_id, employee=request.user)
        if timesheet.status != TimesheetStatus.DRAFT:
            fallback_draft = (
                Timesheet.objects.filter(
                    employee=request.user,
                    week_start=timesheet.week_start,
                    status=TimesheetStatus.DRAFT,
                )
                .order_by("-created_at")
                .first()
            )
            if fallback_draft is None:
                return Response(
                    {"detail": "Only DRAFT timesheets can be submitted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            timesheet = fallback_draft
        if not timesheet.lines.exists():
            return Response({"detail": "Add at least one timesheet line before submit."}, status=status.HTTP_400_BAD_REQUEST)
        timesheet.submit()
        notify_employee_managers(
            request.user,
            "Timesheet submitted",
            f"{employee_display_name(request.user)} submitted timesheet for week {timesheet.week_start}.",
        )
        return Response(TimesheetSerializer(timesheet).data)


class ManagerTimesheetListView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request):
        status_param = request.query_params.get("status", "pending").lower()
        status_map = {
            "pending": TimesheetStatus.SUBMITTED,
            "approved": TimesheetStatus.APPROVED,
            "rejected": TimesheetStatus.REJECTED,
        }
        if status_param not in status_map:
            return Response(
                {"detail": "Invalid status. Use pending|approved|rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = Timesheet.objects.select_related("employee").prefetch_related("lines")
        if request.user.role == UserRole.MANAGER:
            employee_ids = TeamMembership.objects.filter(manager=request.user).values_list("employee_id", flat=True)
            queryset = queryset.filter(employee_id__in=employee_ids)
        queryset = queryset.filter(status=status_map[status_param])
        serializer = ManagerTimesheetListSerializer(queryset, many=True)
        return Response(serializer.data)


class ManagerTimesheetDetailView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request, timesheet_id):
        timesheet = get_object_or_404(
            Timesheet.objects.select_related("employee").prefetch_related("lines", "approvals"),
            id=timesheet_id,
        )
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, timesheet.employee_id):
            return Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        return Response(TimesheetSerializer(timesheet).data)


class ManagerTimesheetLineDetailView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get_object(self, request, line_id):
        line = get_object_or_404(TimesheetLine.objects.select_related("timesheet", "timesheet__employee"), id=line_id)
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, line.timesheet.employee_id):
            return None, Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        if line.timesheet.status not in {
            TimesheetStatus.SUBMITTED,
            TimesheetStatus.APPROVED,
            TimesheetStatus.REJECTED,
        }:
            return None, Response(
                {
                    "detail": (
                        "Managers can edit entries only while the timesheet is in "
                        "SUBMITTED, APPROVED, or REJECTED status."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return line, None

    def patch(self, request, line_id):
        line, error = self.get_object(request, line_id)
        if error:
            return error
        serializer = TimesheetLineSerializer(line, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ManagerTimesheetActionView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    action = None

    def post(self, request, timesheet_id):
        action_serializer = ApprovalActionSerializer(data=request.data)
        action_serializer.is_valid(raise_exception=True)
        timesheet = get_object_or_404(Timesheet, id=timesheet_id)
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, timesheet.employee_id):
            return Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        if timesheet.status not in {
            TimesheetStatus.SUBMITTED,
            TimesheetStatus.APPROVED,
            TimesheetStatus.REJECTED,
        }:
            return Response(
                {"detail": "Manager action is allowed only for SUBMITTED, APPROVED, or REJECTED timesheets."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        new_status = TimesheetStatus.APPROVED if self.action == ApprovalAction.APPROVED else TimesheetStatus.REJECTED
        timesheet.status = new_status
        timesheet.save(update_fields=["status", "updated_at"])
        TimesheetApproval.objects.create(
            timesheet=timesheet,
            manager=request.user,
            action=self.action,
            comment=action_serializer.validated_data.get("comment", ""),
        )
        Notification.objects.create(
            recipient=timesheet.employee,
            title=f"Timesheet {new_status.title()}",
            message=(
                f"Your manager {request.user.username} {new_status.lower()} your timesheet "
                f"for week {timesheet.week_start}."
            ),
        )
        return Response(TimesheetSerializer(timesheet).data)


class ApproveTimesheetView(ManagerTimesheetActionView):
    action = ApprovalAction.APPROVED


class RejectTimesheetView(ManagerTimesheetActionView):
    action = ApprovalAction.REJECTED
    ProjectSerializer,
