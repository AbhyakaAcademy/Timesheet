import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { StatusBadge } from "../StatusBadge";
import { adminApi, formatCurrency } from "@/lib/adminTenantApi";

function downloadInvoicePdf(invoice) {
  const doc = new jsPDF();
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Invoice", 14, 18);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text(`Invoice ID: ${invoice.invoiceNumber || invoice.invoice_number}`, 14, 42);
  doc.text(`Client: ${invoice.clientName || invoice.client_name}`, 14, 52);
  doc.text(`Amount: ${formatCurrency(invoice.total || invoice.total_amount)}`, 14, 62);
  doc.text(`Status: ${invoice.status}`, 14, 72);
  doc.text(`Due Date: ${invoice.dueDate || invoice.due_date || "-"}`, 14, 82);
  doc.save(`${invoice.invoiceNumber || invoice.invoice_number}.pdf`);
}

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    adminApi.invoices().then(setInvoices).catch(() => setInvoices([]));
  }, []);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const id = (invoice.invoiceNumber || invoice.invoice_number || "").toLowerCase();
        const client = (invoice.clientName || invoice.client_name || "").toLowerCase();
        const matchesSearch = id.includes(searchQuery.toLowerCase()) || client.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || invoice.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      }),
    [invoices, searchQuery, statusFilter]
  );

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total || inv.total_amount || 0), 0);
  const paidAmount = filteredInvoices.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + Number(inv.total || inv.total_amount || 0), 0);
  const pendingAmount = filteredInvoices.filter((inv) => inv.status === "Pending").reduce((sum, inv) => sum + Number(inv.total || inv.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-2 text-gray-600">View and manage billing invoices</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><p className="mb-1 text-sm text-gray-600">Total Invoiced</p><p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><p className="mb-1 text-sm text-gray-600">Paid</p><p className="text-2xl font-semibold text-green-600">{formatCurrency(paidAmount)}</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><p className="mb-1 text-sm text-gray-600">Pending</p><p className="text-2xl font-semibold text-yellow-600">{formatCurrency(pendingAmount)}</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><p className="mb-1 text-sm text-gray-600">Count</p><p className="text-2xl font-semibold text-gray-900">{filteredInvoices.length}</p></div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {["all", "paid", "pending", "draft", "sent"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4"><span className="font-mono text-sm font-medium text-gray-900">{invoice.invoiceNumber || invoice.invoice_number}</span></td>
                  <td className="whitespace-nowrap px-6 py-4"><span className="text-sm font-medium text-gray-900">{invoice.clientName || invoice.client_name}</span></td>
                  <td className="whitespace-nowrap px-6 py-4"><span className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total || invoice.total_amount)}</span></td>
                  <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={invoice.status} variant="compact" /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{invoice.dueDate || invoice.due_date || "-"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm"><button onClick={() => { setSelectedInvoice(invoice); setShowViewDialog(true); }} className="mr-3 font-medium text-blue-600 transition-colors hover:text-blue-700">View</button><button onClick={() => downloadInvoicePdf(invoice)} className="font-medium text-gray-600 transition-colors hover:text-gray-700"><Download className="inline h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewDialog && selectedInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewDialog(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Invoice Details</h2>
            <div className="space-y-6">
              <div className="flex items-start justify-between rounded-lg bg-gray-50 p-6">
                <div><p className="mb-1 text-sm text-gray-500">Invoice Number</p><p className="font-mono text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber || selectedInvoice.invoice_number}</p></div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4"><p className="mb-1 text-sm text-gray-500">Client</p><p className="font-medium text-gray-900">{selectedInvoice.clientName || selectedInvoice.client_name}</p></div>
                <div className="rounded-lg bg-gray-50 p-4"><p className="mb-1 text-sm text-gray-500">Amount</p><p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedInvoice.total || selectedInvoice.total_amount)}</p></div>
                <div className="rounded-lg bg-gray-50 p-4"><p className="mb-1 text-sm text-gray-500">Due Date</p><p className="font-medium text-gray-900">{selectedInvoice.dueDate || selectedInvoice.due_date || "-"}</p></div>
                <div className="rounded-lg bg-gray-50 p-4"><p className="mb-1 text-sm text-gray-500">Issue Date</p><p className="font-medium text-gray-900">{selectedInvoice.invoiceDate || selectedInvoice.issued_on || "-"}</p></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowViewDialog(false)} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Close</button>
                <button onClick={() => downloadInvoicePdf(selectedInvoice)} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"><Download className="mr-2 inline h-4 w-4" />Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
