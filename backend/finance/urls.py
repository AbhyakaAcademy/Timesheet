from django.urls import path

from finance.views import (
    AdminBillingRatesView,
    AdminOvertimeRulesView,
    AdminPoliciesView,
    FinanceClientsView,
    FinanceInvoicesView,
    FinanceProjectsView,
)

urlpatterns = [
    path("finance/clients", FinanceClientsView.as_view(), name="finance_clients"),
    path("finance/projects", FinanceProjectsView.as_view(), name="finance_projects"),
    path("finance/invoices", FinanceInvoicesView.as_view(), name="finance_invoices"),
    path("admin/policies", AdminPoliciesView.as_view(), name="admin_policies"),
    path("admin/overtime-rules", AdminOvertimeRulesView.as_view(), name="admin_overtime_rules"),
    path("admin/billing-rates", AdminBillingRatesView.as_view(), name="admin_billing_rates"),
]
