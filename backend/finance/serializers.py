from rest_framework import serializers

from finance.models import BillingRate, Client, Invoice, OvertimeRule, Policy
from timesheets.models import Project


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ("id", "name", "code", "active")


class FinanceProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "code", "client_name", "is_active")


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Invoice
        fields = ("id", "invoice_number", "client", "client_name", "total_amount", "status", "issued_on")


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ("id", "key", "title", "value")


class OvertimeRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRule
        fields = ("id", "name", "threshold_hours", "multiplier", "is_active")


class BillingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingRate
        fields = ("id", "role", "hourly_rate", "currency")
