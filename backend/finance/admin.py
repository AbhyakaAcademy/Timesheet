from django.contrib import admin

from finance.models import BillingRate, Client, Invoice, OvertimeRule, Policy

admin.site.register(Client)
admin.site.register(Invoice)
admin.site.register(Policy)
admin.site.register(OvertimeRule)
admin.site.register(BillingRate)
