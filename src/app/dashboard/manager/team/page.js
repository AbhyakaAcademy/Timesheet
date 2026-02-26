"use client";

import { useState } from "react";
import DashboardFrame from "@/components/dashboard/DashboardFrame";
import Table from "@/components/dashboard/Table";

export default function TeamPage() {
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <DashboardFrame activeTab="team" pendingCount={pendingCount}>
      <Table onPendingCountChange={setPendingCount} />
    </DashboardFrame>
  );
}
