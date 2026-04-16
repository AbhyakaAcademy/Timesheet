"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getRoleHome, getSession } from "@/lib/auth";

export default function RouteGuard({ allowedRoles = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useMemo(() => getSession(), []);

  const hasAccess =
    Boolean(session.token && session.role) &&
    (allowedRoles.length === 0 || allowedRoles.includes(session.role));

  useEffect(() => {
    if (!session.token || !session.role) {
      router.replace("/login");
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      router.replace(getRoleHome(session.role));
      return;
    }
  }, [allowedRoles, pathname, router, session]);

  if (!hasAccess) {
    return null;
  }

  return children;
}
