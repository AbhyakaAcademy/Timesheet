'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const roleRoutes = {
  owner: '/dashboard',
  employee: '/dashboard/employee',
  finance: '/dashboard/finance',
  manager: '/dashboard/manager',
  tenant: '/dashboard/tenant',
};

export function RoleBasedGuard({ allowedRoles, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || 'owner';
    if (!allowedRoles.includes(userRole)) {
      router.replace(roleRoutes[userRole] || '/dashboard');
      return;
    }

    setAuthorized(true);
  }, [allowedRoles, pathname, router]);

  if (!authorized) return null;

  return children;
}
