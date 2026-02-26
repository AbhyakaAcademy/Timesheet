from django.contrib import admin

from timesheets.models import (
    Project,
    TeamMembership,
    TimeEntry,
    Timesheet,
    TimesheetApproval,
    TimesheetLine,
)

admin.site.register(Project)
admin.site.register(TeamMembership)
admin.site.register(TimeEntry)
admin.site.register(Timesheet)
admin.site.register(TimesheetLine)
admin.site.register(TimesheetApproval)
