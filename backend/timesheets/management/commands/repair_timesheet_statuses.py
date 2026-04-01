from django.core.management.base import BaseCommand

from timesheets.models import ApprovalAction, Timesheet, TimesheetStatus


class Command(BaseCommand):
    help = "Repair timesheet statuses that were unintentionally reset to DRAFT."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        fixed = 0
        scanned = 0

        queryset = Timesheet.objects.prefetch_related("approvals").all().order_by("id")
        for timesheet in queryset:
            scanned += 1
            target_status = None

            latest_approval = timesheet.approvals.order_by("-acted_at").first()
            if latest_approval:
                if latest_approval.action == ApprovalAction.APPROVED:
                    target_status = TimesheetStatus.APPROVED
                elif latest_approval.action == ApprovalAction.REJECTED:
                    target_status = TimesheetStatus.REJECTED
            elif timesheet.submitted_at and timesheet.status == TimesheetStatus.DRAFT:
                # If a draft has submitted_at and no approval action, treat it as submitted.
                target_status = TimesheetStatus.SUBMITTED

            if target_status and timesheet.status != target_status:
                fixed += 1
                self.stdout.write(
                    f"Timesheet #{timesheet.id}: {timesheet.status} -> {target_status}"
                )
                if not dry_run:
                    timesheet.status = target_status
                    timesheet.save(update_fields=["status", "updated_at"])

        mode = "DRY RUN" if dry_run else "UPDATED"
        self.stdout.write(self.style.SUCCESS(f"{mode}: scanned={scanned}, fixed={fixed}"))

