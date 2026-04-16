import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { adminApi } from "@/lib/adminTenantApi";

const emptyClient = {
  name: "",
  email: "",
  phone: "",
  plan: "Professional",
  users: 25,
  status: "Active",
  industry: "Technology",
  revenue: 0,
};

export function Clients() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [error, setError] = useState("");

  const loadClients = async () => {
    try {
      setError("");
      setClients(await adminApi.clients());
    } catch (err) {
      setError(err.message || "Failed to load clients.");
    }
  };

  useEffect(() => {
    let active = true;

    adminApi
      .clients()
      .then((payload) => {
        if (!active) return;
        setError("");
        setClients(payload);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load clients.");
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const haystack = `${client.name} ${client.contact_email || ""}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      }),
    [clients, searchQuery, statusFilter]
  );

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowViewDialog(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
      email: client.contact_email || "",
      phone: client.contact_phone || "",
      plan: client.plan || "Professional",
      users: client.users || 1,
      status: client.status,
      industry: client.industry || "Technology",
      revenue: client.revenue || 0,
    });
    setShowEditDialog(true);
  };

  const handleDisableClient = async (client) => {
    await adminApi.updateClient(client.id, { status: "Inactive" });
    await loadClients();
  };

  const saveNewClient = async () => {
    if (!clientForm.name.trim() || !clientForm.email.trim()) return;
    await adminApi.createClient(clientForm);
    await loadClients();
    setShowAddClientDialog(false);
  };

  const saveEditedClient = async () => {
    if (!selectedClient) return;
    await adminApi.updateClient(selectedClient.id, clientForm);
    await loadClients();
    setShowEditDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-2 text-gray-600">Manage all client accounts and subscriptions</p>
        </div>
        <button
          onClick={() => {
            setClientForm(emptyClient);
            setShowAddClientDialog(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">{client.name.charAt(0)}</div><div className="ml-4"><div className="font-medium text-gray-900">{client.name}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.contact_email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900">{client.plan}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={client.status} variant="compact" /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.createdDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => handleViewClient(client)} className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors">View</button><button onClick={() => handleEditClient(client)} className="text-gray-600 hover:text-gray-700 font-medium mr-3 transition-colors">Edit</button><button onClick={() => handleDisableClient(client)} className="text-red-600 hover:text-red-700 font-medium transition-colors">Disable</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddClientDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddClientDialog(false); setShowEditDialog(false); }} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{showEditDialog ? "Edit Client" : "Add New Client"}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={clientForm.name} onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label><input type="email" value={clientForm.email} onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={clientForm.phone} onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input type="text" value={clientForm.industry} onChange={(e) => setClientForm((prev) => ({ ...prev, industry: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><select value={clientForm.plan} onChange={(e) => setClientForm((prev) => ({ ...prev, plan: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Starter</option><option>Professional</option><option>Enterprise</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Active Users</label><input type="number" value={clientForm.users} onChange={(e) => setClientForm((prev) => ({ ...prev, users: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue</label><input type="number" value={clientForm.revenue} onChange={(e) => setClientForm((prev) => ({ ...prev, revenue: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={clientForm.status} onChange={(e) => setClientForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Active</option><option>Inactive</option></select></div>
              <div className="flex gap-3 pt-4"><button onClick={() => { setShowAddClientDialog(false); setShowEditDialog(false); }} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">Cancel</button><button onClick={showEditDialog ? saveEditedClient : saveNewClient} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{showEditDialog ? "Save Changes" : "Add Client"}</button></div>
            </div>
          </div>
        </div>
      )}

      {showViewDialog && selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewDialog(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Plan</p><p className="font-medium text-gray-900">{selectedClient.plan}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Active Users</p><p className="font-medium text-gray-900">{selectedClient.users}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Status</p><StatusBadge status={selectedClient.status} variant="compact" /></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Created Date</p><p className="font-medium text-gray-900">{selectedClient.createdDate}</p></div>
              </div>
              <button onClick={() => setShowViewDialog(false)} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
