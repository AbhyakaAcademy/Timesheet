"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { getRoleHome, getSessionSnapshot } from "@/lib/auth";

export default function RouteGuard({ allowedRoles = [], children }) {
  const router = useRouter();
  const session = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", callback);
      window.addEventListener("auth-session-updated", callback);
      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener("auth-session-updated", callback);
      };
    },
    getSessionSnapshot,
    getSessionSnapshot
  );
  const isMounted = useSyncExternalStore(
    (callback) => {
      callback();
      return () => {};
    },
    () => true,
    () => false
  );

  const hasAccess = Boolean(session.token && session.role) && (allowedRoles.length === 0 || allowedRoles.includes(session.role));

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (!session.token || !session.role) {
      router.replace("/login");
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      router.replace(getRoleHome(session.role));
      return;
    }
  }, [allowedRoles, isMounted, router, session]);

  if (!isMounted || !hasAccess) {
    return null;
  }

  return children;
}
