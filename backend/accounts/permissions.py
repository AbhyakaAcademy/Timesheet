from rest_framework.permissions import BasePermission

from accounts.models import UserRole


class HasRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in self.allowed_roles)


class IsEmployee(HasRole):
    allowed_roles = (UserRole.EMPLOYEE,)


class IsManager(HasRole):
    allowed_roles = (UserRole.MANAGER,)


class IsAdmin(HasRole):
    allowed_roles = (UserRole.ADMIN,)


class IsTenant(HasRole):
    allowed_roles = (UserRole.TENANT,)


class IsFinance(HasRole):
    allowed_roles = (UserRole.FINANCE,)


class IsManagerOrAdmin(HasRole):
    allowed_roles = (UserRole.MANAGER, UserRole.ADMIN)


class IsFinanceOrAdmin(HasRole):
    allowed_roles = (UserRole.FINANCE, UserRole.ADMIN)


class IsTenantOrAdmin(HasRole):
    allowed_roles = (UserRole.TENANT, UserRole.ADMIN)
