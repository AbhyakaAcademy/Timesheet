from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    EMPLOYEE = "employee", "Employee"
    MANAGER = "manager", "Manager"
    ADMIN = "admin", "Admin"
    FINANCE = "finance", "Finance"
    TENANT = "tenant", "Tenant"


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
    )
    organization = models.ForeignKey(
        "tenants.TenantOrganization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    department = models.ForeignKey(
        "tenants.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )


class TenantSignupRequest(models.Model):
    email = models.EmailField(unique=True)
    organization_name = models.CharField(max_length=140)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    password_hash = models.CharField(max_length=128)
    verification_token_hash = models.CharField(max_length=64, unique=True)
    token_expires_at = models.DateTimeField()
    verified_user = models.OneToOneField(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signup_request",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.email} -> {self.organization_name}"


class UserInvitation(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="invitation",
    )
    invited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )
    invitation_token_hash = models.CharField(max_length=64, unique=True)
    token_expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} invite"


class PasswordResetRequest(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="password_reset_request",
    )
    reset_token_hash = models.CharField(max_length=64, unique=True)
    token_expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} password reset"
