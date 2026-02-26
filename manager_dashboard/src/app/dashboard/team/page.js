import DashboardFrame from "@/components/dashboard/DashboardFrame";
import Table from "@/components/dashboard/Table";

export default function TeamPage() {
  return (
    <DashboardFrame activeTab="team">
      <Table />
    </DashboardFrame>
  );
}
