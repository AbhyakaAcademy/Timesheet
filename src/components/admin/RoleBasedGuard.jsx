'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function RoleBasedGuard({ allowedRoles, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const userRole = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('userRole') || 'owner';
  }, []);
  const authorized = allowedRoles.includes(userRole);

  useEffect(() => {
    if (!allowedRoles.includes(userRole)) {
      router.replace(
        {
          owner: '/dashboard',
          employee: '/dashboard/employee',
          finance: '/dashboard/finance',
          manager: '/dashboard/manager',
          admin: '/dashboard/admin/overview',
          tenant: '/dashboard/tenant',
        }[userRole] || '/dashboard'
      );
      return;
    }
  }, [allowedRoles, pathname, router, userRole]);

  if (!authorized) return null;

  return children;
}
