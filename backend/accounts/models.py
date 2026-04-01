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
