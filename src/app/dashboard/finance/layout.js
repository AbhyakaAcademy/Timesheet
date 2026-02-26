"use client";

import { useRouter } from "next/navigation";
import RouteGuard from "@/components/auth/RouteGuard";
import { clearSession } from "@/lib/auth";

export default function FinanceDashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <RouteGuard allowedRoles={["finance"]}>
      <div>
        <button
          onClick={handleLogout}
          className="fixed right-4 top-4 z-50 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
        {children}
      </div>
    </RouteGuard>
  );
}
