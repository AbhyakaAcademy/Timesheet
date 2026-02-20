from django.contrib.auth.models import AbstractUser
from django.db import models
from tenants.models import Tenant


class User(AbstractUser):

    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('finance', 'Finance'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users'
    )

    def __str__(self):
        return self.username
