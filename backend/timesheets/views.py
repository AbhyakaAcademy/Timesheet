from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsEmployee, IsManagerOrAdmin
from accounts.services import send_user_invitation_email
from notifications.models import Notification
from tenants.models import Department
from tenants.serializers import TenantUserSerializer
from timesheets.models import (
    ManualEntryRequest,
    ManualEntryRequestStatus,
    ApprovalAction,
    Project,
    ShiftType,
    TeamMembership,
    TimeEntry,
    TimeEntrySource,
    Timesheet,
    TimesheetApproval,
    TimesheetAttachment,
    TimesheetLine,
    TimesheetStatus,
)
from timesheets.serializers import (
    ApprovalActionSerializer,
    EmployeeDashboardSummarySerializer,
    ManualEntryRequestCreateSerializer,
    ManualEntryRequestDecisionSerializer,
    ManualEntryRequestRejectSerializer,
    ManualEntryRequestSerializer,
    ManualTimeEntrySerializer,
    ManagerManualTimeEntrySerializer,
    ManagerTimesheetListSerializer,
    ProjectSerializer,
    PunchInSerializer,
    PunchOutSerializer,
    TimeEntrySerializer,
    TimesheetAttachmentSerializer,
    TimesheetLineCreateSerializer,
    TimesheetLineSerializer,
    TimesheetSerializer,
)

User = get_user_model()


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


def get_managers_for_employee(employee):
    return [
        member.manager
        for member in TeamMembership.objects.select_related("manager").filter(employee=employee)
    ]


def _split_name(value):
    parts = [part for part in (value or "").strip().split() if part]
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _build_username(name, email):
    seed = (email or "").split("@")[0].strip().lower() or "".join(part.lower() for part in name.split()) or "employee"
    username = seed[:150]
    original = username
    index = 2
    while User.objects.filter(username=username).exists():
        username = f"{original[:140]}{index}"
        index += 1
    return username


def _create_manager_employee(payload, manager):
    organization = manager.organization
    if organization is None:
        raise ValueError("Manager is not linked to an organization.")

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    department_name = (payload.get("department") or "").strip()

    if not name or not email or not department_name:
        raise ValueError("Name, email, and department are required.")

    if User.objects.filter(email__iexact=email).exists():
        raise ValueError("A user with this email already exists.")

    first_name, last_name = _split_name(name)
    department, _ = Department.objects.get_or_create(
        organization=organization,
        name=department_name,
        defaults={"status": "Active"},
    )

    user = User.objects.create(
        username=_build_username(name, email),
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=UserRole.EMPLOYEE,
        organization=organization,
        department=department,
        is_active=False,
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])

    TeamMembership.objects.get_or_create(manager=manager, employee=user)
    delivery = send_user_invitation_email(
        user=user,
        invited_by=manager,
        invited_by_name=manager.get_full_name() or manager.username,
    )
    return user, delivery


def _get_or_create_manager_target_timesheet_for_date(employee, target_date):
    week_start = target_date - timedelta(days=target_date.weekday())
    existing_timesheets = list(
        Timesheet.objects.filter(employee=employee, week_start=week_start).order_by("-created_at")
    )
    for preferred_status in [TimesheetStatus.SUBMITTED, TimesheetStatus.APPROVED, TimesheetStatus.REJECTED, TimesheetStatus.DRAFT]:
        matching = next((sheet for sheet in existing_timesheets if sheet.status == preferred_status), None)
        if matching:
            return matching

    try:
        return Timesheet.objects.create(
            employee=employee,
            week_start=week_start,
            status=TimesheetStatus.DRAFT,
        )
    except IntegrityError:
        existing = (
            Timesheet.objects.filter(employee=employee, week_start=week_start, status=TimesheetStatus.DRAFT)
            .order_by("-created_at")
            .first()
        )
        if existing:
            return existing
        return Timesheet.objects.filter(employee=employee, week_start=week_start).order_by("-created_at").first()


def _create_manual_entry_and_timesheet_line(*, employee, project, start_time, end_time, note, description):
    entry = TimeEntry.objects.create(
        employee=employee,
        project=project,
        source=TimeEntrySource.MANUAL,
        start_time=start_time,
        end_time=end_time,
        note=note or "",
    )
    entry.calculate_duration()
    entry.save(update_fields=["duration_minutes", "updated_at"])

    timesheet = _get_or_create_manager_target_timesheet_for_date(employee, start_time.date())
    hours = max(round(entry.duration_minutes / 60, 2), 0.01)
    TimesheetLine.objects.create(
        timesheet=timesheet,
        date=start_time.date(),
        project=project,
        description=description or note or "Manager added manual entry",
        hours=hours,
        shift=ShiftType.DAY,
        time_entry=entry,
    )
    return entry


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
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def post(self, request):
        serializer = ManagerManualTimeEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = get_object_or_404(User, id=serializer.validated_data["employee_id"], role=UserRole.EMPLOYEE)
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, employee.id):
            return Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        project = Project.objects.get(id=serializer.validated_data["project_id"])
        entry = _create_manual_entry_and_timesheet_line(
            employee=employee,
            project=project,
            start_time=serializer.validated_data["start_time"],
            end_time=serializer.validated_data["end_time"],
            note=serializer.validated_data.get("note", ""),
            description=serializer.validated_data.get("note", "") or "Manager added manual entry",
        )
        Notification.objects.create(
            recipient=employee,
            title="Manual time entry added",
            message=(
                f"Your manager added a manual time entry for {project.name} "
                f"({entry.duration_minutes} minutes)."
            ),
        )
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class EmployeeManualEntryRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        queryset = ManualEntryRequest.objects.filter(employee=request.user)
        return Response(ManualEntryRequestSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = ManualEntryRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        manual_request = ManualEntryRequest.objects.create(
            employee=request.user,
            request_type=serializer.validated_data["request_type"].strip(),
            request_date=serializer.validated_data["request_date"],
            comment=serializer.validated_data["comment"].strip(),
        )
        display_date = manual_request.request_date.strftime("%b %d, %Y")
        notify_employee_managers(
            request.user,
            "Manual entry request submitted",
            (
                f"{employee_display_name(request.user)} submitted a {manual_request.request_type.lower()} "
                f"request for {display_date}."
            ),
        )
        return Response(ManualEntryRequestSerializer(manual_request).data, status=status.HTTP_201_CREATED)


class CurrentTimesheetView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        current_week_start = week_start_for(timezone.now())
        week_timesheets = Timesheet.objects.filter(
            employee=request.user,
            week_start=current_week_start,
        ).order_by("-created_at")

        timesheet = week_timesheets.filter(status=TimesheetStatus.DRAFT).first()
        if timesheet is not None and not timesheet.lines.exists():
            fallback_timesheet = week_timesheets.exclude(id=timesheet.id).first()
            if fallback_timesheet is not None:
                timesheet = fallback_timesheet
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


class TimesheetAttachmentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, timesheet_id):
        timesheet = get_object_or_404(Timesheet, id=timesheet_id, employee=request.user)
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            return Response({"detail": "Select at least one file to upload."}, status=status.HTTP_400_BAD_REQUEST)

        attachments = [
            TimesheetAttachment.objects.create(
                timesheet=timesheet,
                uploaded_by=request.user,
                file=file_obj,
                original_name=file_obj.name,
                content_type=getattr(file_obj, "content_type", "") or "",
                size=file_obj.size,
            )
            for file_obj in files
        ]
        notify_employee_managers(
            request.user,
            "Timesheet file uploaded",
            f"{employee_display_name(request.user)} uploaded {len(attachments)} file(s) for week {timesheet.week_start}.",
        )
        return Response(TimesheetAttachmentSerializer(attachments, many=True).data, status=status.HTTP_201_CREATED)


class TimesheetAttachmentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attachment_id):
        attachment = get_object_or_404(
            TimesheetAttachment.objects.select_related("timesheet", "timesheet__employee"),
            id=attachment_id,
        )
        is_owner = attachment.timesheet.employee_id == request.user.id
        is_manager = request.user.role == UserRole.MANAGER and manager_has_employee(request.user, attachment.timesheet.employee_id)
        is_staff_role = request.user.role in {UserRole.ADMIN, UserRole.TENANT}
        if not (is_owner or is_manager or is_staff_role):
            return Response({"detail": "You do not have access to this file."}, status=status.HTTP_403_FORBIDDEN)

        response = FileResponse(attachment.file.open("rb"), content_type=attachment.content_type or "application/octet-stream")
        response["Content-Disposition"] = f'inline; filename="{attachment.original_name}"'
        return response


class ManagerTimesheetAttachmentListView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request):
        queryset = TimesheetAttachment.objects.select_related(
            "timesheet",
            "timesheet__employee",
            "uploaded_by",
        )
        if request.user.role == UserRole.MANAGER:
            employee_ids = TeamMembership.objects.filter(manager=request.user).values_list("employee_id", flat=True)
            queryset = queryset.filter(timesheet__employee_id__in=employee_ids)
        return Response(TimesheetAttachmentSerializer(queryset[:50], many=True).data)


class ManagerEmployeesView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request):
        queryset = User.objects.filter(role=UserRole.EMPLOYEE)
        if request.user.role == UserRole.MANAGER:
            employee_ids = TeamMembership.objects.filter(manager=request.user).values_list("employee_id", flat=True)
            queryset = queryset.filter(id__in=employee_ids)
        queryset = queryset.select_related("department", "organization", "invitation").order_by("-date_joined")
        return Response(TenantUserSerializer(queryset, many=True).data)

    def post(self, request):
        if request.user.role != UserRole.MANAGER:
            return Response({"detail": "Only managers can invite employees from this flow."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user, delivery = _create_manager_employee(request.data, request.user)
        except Exception as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        payload = TenantUserSerializer(user).data
        if delivery and delivery.get("delivery_mode") == "development":
            payload["invitation_url"] = delivery.get("invitation_url")
            payload["invite_message"] = "Email is not configured locally, so use the invite link below."
        return Response(payload, status=status.HTTP_201_CREATED)


class ManagerManualEntryRequestListView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request):
        queryset = ManualEntryRequest.objects.select_related("employee", "resolved_by", "approved_entry")
        status_param = (request.query_params.get("status") or "pending").upper()
        if status_param in ManualEntryRequestStatus.values:
            queryset = queryset.filter(status=status_param)

        if request.user.role == UserRole.MANAGER:
            employee_ids = TeamMembership.objects.filter(manager=request.user).values_list("employee_id", flat=True)
            queryset = queryset.filter(employee_id__in=employee_ids)
        return Response(ManualEntryRequestSerializer(queryset, many=True).data)


class ManagerManualEntryRequestApproveView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def post(self, request, request_id):
        serializer = ManualEntryRequestDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        manual_request = get_object_or_404(ManualEntryRequest.objects.select_related("employee"), id=request_id)
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, manual_request.employee_id):
            return Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        if manual_request.status != ManualEntryRequestStatus.PENDING:
            return Response({"detail": "This request has already been resolved."}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.get(id=serializer.validated_data["project_id"])
        entry = _create_manual_entry_and_timesheet_line(
            employee=manual_request.employee,
            project=project,
            start_time=serializer.validated_data["start_time"],
            end_time=serializer.validated_data["end_time"],
            note=serializer.validated_data.get("note", ""),
            description=serializer.validated_data.get("note", "") or manual_request.comment,
        )
        manual_request.status = ManualEntryRequestStatus.APPROVED
        manual_request.manager_comment = serializer.validated_data.get("manager_comment", "")
        manual_request.resolved_by = request.user
        manual_request.approved_entry = entry
        manual_request.resolved_at = timezone.now()
        manual_request.save(update_fields=["status", "manager_comment", "resolved_by", "approved_entry", "resolved_at", "updated_at"])

        Notification.objects.create(
            recipient=manual_request.employee,
            title="Manual entry request approved",
            message=(
                f"Your manager approved the missed punch request for {manual_request.request_date} "
                f"and added a manual time entry."
            ),
        )
        return Response(ManualEntryRequestSerializer(manual_request).data)


class ManagerManualEntryRequestRejectView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def post(self, request, request_id):
        serializer = ManualEntryRequestRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        manual_request = get_object_or_404(ManualEntryRequest.objects.select_related("employee"), id=request_id)
        if request.user.role == UserRole.MANAGER and not manager_has_employee(request.user, manual_request.employee_id):
            return Response({"detail": "You do not manage this employee."}, status=status.HTTP_403_FORBIDDEN)
        if manual_request.status != ManualEntryRequestStatus.PENDING:
            return Response({"detail": "This request has already been resolved."}, status=status.HTTP_400_BAD_REQUEST)

        manual_request.status = ManualEntryRequestStatus.REJECTED
        manual_request.manager_comment = serializer.validated_data["manager_comment"].strip()
        manual_request.resolved_by = request.user
        manual_request.resolved_at = timezone.now()
        manual_request.save(update_fields=["status", "manager_comment", "resolved_by", "resolved_at", "updated_at"])

        Notification.objects.create(
            recipient=manual_request.employee,
            title="Manual entry request rejected",
            message=(
                f"Your manager rejected the missed punch request for {manual_request.request_date}. "
                f"Comment: {manual_request.manager_comment}"
            ),
        )
        return Response(ManualEntryRequestSerializer(manual_request).data)


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
            Timesheet.objects.select_related("employee").prefetch_related("lines", "approvals", "attachments"),
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
