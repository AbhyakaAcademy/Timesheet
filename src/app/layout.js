import EmployeePreferencesSync from "@/components/employee/EmployeePreferencesSync";
import "./globals.css";

export const metadata = {
  title: "Abhyaka",
  description: "Enterprise time intelligence platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900">
        <EmployeePreferencesSync />
        <main>{children}</main>
      </body>
    </html>
  );
}
