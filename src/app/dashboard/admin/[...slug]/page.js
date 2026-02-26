"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Analytics } from "@/components/admin/pages/Analytics";
import { Clients } from "@/components/admin/pages/Clients";
import { CustomerSupport } from "@/components/admin/pages/CustomerSupport";
import { Invoices } from "@/components/admin/pages/Invoices";
import { IssuesLog } from "@/components/admin/pages/IssuesLog";
import { NotFound } from "@/components/admin/pages/NotFound";
import { Overview } from "@/components/admin/pages/Overview";
import { Revenue } from "@/components/admin/pages/Revenue";
import { Settings } from "@/components/admin/pages/Settings";
import { Subscriptions } from "@/components/admin/pages/Subscriptions";
import { SystemHealth } from "@/components/admin/pages/SystemHealth";
import { Users } from "@/components/admin/pages/Users";

const ownerRouteMap = {
  overview: Overview,
  clients: Clients,
  users: Users,
  revenue: Revenue,
  subscriptions: Subscriptions,
  issues: IssuesLog,
  invoices: Invoices,
  analytics: Analytics,
  "system-health": SystemHealth,
  support: CustomerSupport,
  settings: Settings,
};

export default function AdminDashboardCatchAllPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam : slugParam ? [slugParam] : [];
  const routeKey = slug.join("/") || "overview";

  const OwnerComponent = ownerRouteMap[routeKey] || NotFound;

  return (
    <DashboardLayout>
      <OwnerComponent />
    </DashboardLayout>
  );
}
