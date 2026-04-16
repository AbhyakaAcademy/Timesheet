from django.contrib import admin

from tenants.models import (
    Department,
    PlatformSettings,
    TenantAuditLog,
    TenantBillingRate,
    TenantOrganization,
    TenantOvertimeRule,
    TenantPolicy,
    TenantSubscription,
)

admin.site.register(TenantOrganization)
admin.site.register(Department)
admin.site.register(TenantPolicy)
admin.site.register(TenantBillingRate)
admin.site.register(TenantOvertimeRule)
admin.site.register(TenantSubscription)
admin.site.register(TenantAuditLog)
admin.site.register(PlatformSettings)
