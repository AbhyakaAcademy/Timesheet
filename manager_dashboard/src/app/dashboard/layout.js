import Header from "@/components/dashboard/Header";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="px-4 py-5 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
