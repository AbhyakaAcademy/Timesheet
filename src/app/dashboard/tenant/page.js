"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import RouteGuard from "@/components/auth/RouteGuard";

export default function TenantDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <RouteGuard allowedRoles={["tenant", "admin"]}>Loading...</RouteGuard>;
}
