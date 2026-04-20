import { Users as UsersIcon, UserPlus, Search, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { adminApi } from "@/lib/adminTenantApi";

const emptyUser = { name: "", email: "", organization: "", role: "employee", status: "Active", department: "General" };

export function Users() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setError("");
      setUsers(await adminApi.users());
    } catch (err) {
      setError(err.message || "Failed to load users.");
    }
  };

  useEffect(() => {
    let active = true;

    adminApi
      .users()
      .then((payload) => {
        if (!active) return;
        setError("");
        setUsers(payload);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load users.");
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const company = user.organization_name || "";
        const matchesSearch = `${user.name} ${user.email} ${company}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
      }),
    [roleFilter, searchQuery, users]
  );

  const openAddUser = () => {
    setEditingUserId(null);
    setForm(emptyUser);
    setShowUserDialog(true);
  };

  const openEditUser = (user) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      organization: user.organization || "",
      role: user.role,
      status: user.status,
      department: user.department,
    });
    setShowUserDialog(true);
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingUserId) {
      await adminApi.updateUser(editingUserId, form);
    } else {
      await adminApi.createUser(form);
    }
    await loadUsers();
    setShowUserDialog(false);
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Total Users</h1>
          <p className="mt-2 text-gray-600">View and manage all platform users</p>
        </div>
        <button onClick={openAddUser} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-blue-50 p-3 w-fit"><UsersIcon className="h-5 w-5 text-blue-600" /></div><p className="text-sm text-gray-600 mb-1">Total Users</p><p className="text-2xl font-semibold text-gray-900">{totalUsers}</p></div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-green-50 p-3 w-fit"><UsersIcon className="h-5 w-5 text-green-600" /></div><p className="text-sm text-gray-600 mb-1">Active Users</p><p className="text-2xl font-semibold text-gray-900">{activeUsers}</p></div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"><div className="mb-4 rounded-lg bg-purple-50 p-3 w-fit"><Shield className="h-5 w-5 text-purple-600" /></div><p className="text-sm text-gray-600 mb-1">Admin Users</p><p className="text-2xl font-semibold text-gray-900">{adminUsers}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">{["all", "admin", "tenant", "employee", "manager", "finance"].map((role) => <button key={role} onClick={() => setRoleFilter(role)} className={`rounded-lg border px-4 py-2 text-sm font-medium ${roleFilter === role ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>{role === "all" ? "All Roles" : role.charAt(0).toUpperCase() + role.slice(1)}</button>)}</div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Active</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Join Date</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">{user.name.split(" ").map((n) => n[0]).join("")}</div><div className="ml-4"><div className="font-medium text-gray-900">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.organization_name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${user.role === "admin" ? "border border-purple-200 bg-purple-50 text-purple-700" : "border border-blue-200 bg-blue-50 text-blue-700"}`}>{user.role === "admin" ? <Shield className="h-3 w-3" /> : null}{user.role}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={user.status} variant="compact" /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => { setSelectedUser(user); setShowViewDialog(true); }} className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors">View</button><button onClick={() => openEditUser(user)} className="text-gray-600 hover:text-gray-700 font-medium transition-colors">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewDialog && selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewDialog(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Company</p><p className="font-medium text-gray-900">{selectedUser.organization_name || "-"}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Role</p><p className="font-medium text-gray-900">{selectedUser.role}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Status</p><StatusBadge status={selectedUser.status} variant="compact" /></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Department</p><p className="font-medium text-gray-900">{selectedUser.department}</p></div>
            </div>
            <button onClick={() => setShowViewDialog(false)} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      ) : null}

      {showUserDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserDialog(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingUserId ? "Edit User" : "Add New User"}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input type="text" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="employee">Employee</option><option value="manager">Manager</option><option value="tenant">Tenant</option><option value="admin">Admin</option><option value="finance">Finance</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>Active</option><option>Inactive</option></select></div></div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowUserDialog(false)} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">Cancel</button><button onClick={saveUser} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">{editingUserId ? "Save Changes" : "Add User"}</button></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
