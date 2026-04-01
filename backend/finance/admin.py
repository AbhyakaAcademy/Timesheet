from django.contrib import admin

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

admin.site.register(Client)
admin.site.register(Invoice)
admin.site.register(Policy)
admin.site.register(OvertimeRule)
admin.site.register(BillingRate)
admin.site.register(ProjectFinanceProfile)
admin.site.register(ProjectTask)
admin.site.register(ProjectRate)
admin.site.register(EmployeeRateOverride)
admin.site.register(Expense)
admin.site.register(InvoiceLineItem)
admin.site.register(ExportJob)
