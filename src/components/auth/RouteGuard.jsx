"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getRoleHome, getSession } from "@/lib/auth";

export default function RouteGuard({ allowedRoles = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { token, role } = getSession();
    if (!token || !role) {
      router.replace("/login");
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      router.replace(getRoleHome(role));
      return;
    }

    setReady(true);
  }, [allowedRoles, pathname, router]);

  if (!ready) {
    return null;
  }

  return children;
}
