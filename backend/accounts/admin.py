from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import TenantSignupRequest, User


@admin.register(User)
class AppUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Role", {"fields": ("role",)}),
    )
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")


@admin.register(TenantSignupRequest)
class TenantSignupRequestAdmin(admin.ModelAdmin):
    list_display = ("email", "organization_name", "verified_at", "token_expires_at", "created_at")
    search_fields = ("email", "organization_name")
    readonly_fields = ("created_at", "updated_at", "verified_at")
