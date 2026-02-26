from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsFinanceOrAdmin
from finance.models import BillingRate, Client, Invoice, OvertimeRule, Policy
from finance.serializers import (
    BillingRateSerializer,
    ClientSerializer,
    FinanceProjectSerializer,
    InvoiceSerializer,
    OvertimeRuleSerializer,
    PolicySerializer,
)
from timesheets.models import Project


class FinanceClientsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        data = ClientSerializer(Client.objects.all(), many=True).data
        return Response(data)


class FinanceProjectsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        data = FinanceProjectSerializer(Project.objects.all(), many=True).data
        return Response(data)


class FinanceInvoicesView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceOrAdmin]

    def get(self, request):
        data = InvoiceSerializer(Invoice.objects.select_related("client").all(), many=True).data
        return Response(data)


class AdminPoliciesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(PolicySerializer(Policy.objects.all(), many=True).data)


class AdminOvertimeRulesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(OvertimeRuleSerializer(OvertimeRule.objects.all(), many=True).data)


class AdminBillingRatesView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(BillingRateSerializer(BillingRate.objects.all(), many=True).data)
