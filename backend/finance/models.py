from django.db import models


class Client(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40, unique=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=40, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default="pending")
    issued_on = models.DateField()

    class Meta:
        ordering = ("-issued_on", "invoice_number")


class Policy(models.Model):
    key = models.CharField(max_length=80, unique=True)
    title = models.CharField(max_length=140)
    value = models.CharField(max_length=300)


class OvertimeRule(models.Model):
    name = models.CharField(max_length=120)
    threshold_hours = models.DecimalField(max_digits=5, decimal_places=2)
    multiplier = models.DecimalField(max_digits=4, decimal_places=2)
    is_active = models.BooleanField(default=True)


class BillingRate(models.Model):
    role = models.CharField(max_length=30, unique=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
