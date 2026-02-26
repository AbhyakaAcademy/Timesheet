import { Download, Search, Filter, Eye } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../StatusBadge';

const invoicesData = [
  { id: 'INV-001', client: 'Acme Corporation', amount: 2499, status: 'Paid', dueDate: 'Feb 01, 2026', paidDate: 'Jan 28, 2026', method: 'Credit Card' },
  { id: 'INV-002', client: 'TechStart Inc', amount: 1299, status: 'Paid', dueDate: 'Feb 05, 2026', paidDate: 'Feb 03, 2026', method: 'Bank Transfer' },
  { id: 'INV-003', client: 'Global Dynamics', amount: 799, status: 'Pending', dueDate: 'Feb 18, 2026', paidDate: '-', method: '-' },
  { id: 'INV-004', client: 'Innovation Labs', amount: 2499, status: 'Paid', dueDate: 'Feb 10, 2026', paidDate: 'Feb 09, 2026', method: 'Credit Card' },
  { id: 'INV-005', client: 'Digital Solutions', amount: 1299, status: 'Overdue', dueDate: 'Jan 25, 2026', paidDate: '-', method: '-' },
  { id: 'INV-006', client: 'Cloud Systems', amount: 799, status: 'Paid', dueDate: 'Feb 08, 2026', paidDate: 'Feb 07, 2026', method: 'PayPal' },
  { id: 'INV-007', client: 'DataFlow Inc', amount: 2499, status: 'Pending', dueDate: 'Feb 22, 2026', paidDate: '-', method: '-' },
  { id: 'INV-008', client: 'NextGen Tech', amount: 1299, status: 'Paid', dueDate: 'Feb 12, 2026', paidDate: 'Feb 11, 2026', method: 'Credit Card' },
];

export function Invoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const filteredInvoices = invoicesData.filter((invoice) => {
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      invoice.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-2 text-gray-600">View and manage billing invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Invoiced</p>
          <p className="text-2xl font-semibold text-gray-900">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">${paidAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">${pendingAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">${overdueAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter('paid')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'paid'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Paid
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setStatusFilter('overdue')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'overdue'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{invoice.client}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">${invoice.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.paidDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewInvoice(invoice)}
                      className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors"
                    >
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">
                      <Download className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">No invoices found matching your search criteria</p>
          </div>
        )}
      </div>

      {/* View Invoice Dialog */}
      {showViewDialog && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewDialog(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Invoice Details</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-start p-6 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">{selectedInvoice.id}</p>
                </div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Client</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.client}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">${selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.dueDate}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Paid Date</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.paidDate}</p>
                </div>
                {selectedInvoice.method !== '-' && (
                  <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                    <p className="font-medium text-gray-900">{selectedInvoice.method}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowViewDialog(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4 inline mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
