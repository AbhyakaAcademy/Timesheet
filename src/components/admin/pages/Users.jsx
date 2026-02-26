import { Users as UsersIcon, UserPlus, Search, Filter, Shield, Mail } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../StatusBadge';

const usersData = [
  { id: 1, name: 'John Smith', email: 'john.smith@acme.com', company: 'Acme Corporation', role: 'Admin', status: 'Active', lastActive: '2 hours ago', joinDate: 'Jan 15, 2024' },
  { id: 2, name: 'Sarah Wilson', email: 'sarah.w@techstart.com', company: 'TechStart Inc', role: 'User', status: 'Active', lastActive: '5 hours ago', joinDate: 'Feb 03, 2024' },
  { id: 3, name: 'Mike Johnson', email: 'mjohnson@global.com', company: 'Global Dynamics', role: 'User', status: 'Active', lastActive: '1 day ago', joinDate: 'Dec 20, 2023' },
  { id: 4, name: 'Emily Davis', email: 'e.davis@innovation.com', company: 'Innovation Labs', role: 'Admin', status: 'Active', lastActive: '3 hours ago', joinDate: 'Jan 28, 2024' },
  { id: 5, name: 'Alex Chen', email: 'alex@digital.com', company: 'Digital Solutions', role: 'User', status: 'Suspended', lastActive: '2 weeks ago', joinDate: 'Nov 12, 2023' },
  { id: 6, name: 'Lisa Brown', email: 'lisa.b@cloud.com', company: 'Cloud Systems', role: 'User', status: 'Active', lastActive: '1 hour ago', joinDate: 'Feb 10, 2024' },
  { id: 7, name: 'David Lee', email: 'dlee@dataflow.com', company: 'DataFlow Inc', role: 'Admin', status: 'Active', lastActive: '4 hours ago', joinDate: 'Jan 05, 2024' },
  { id: 8, name: 'Rachel Green', email: 'rgreen@nextgen.com', company: 'NextGen Tech', role: 'User', status: 'Active', lastActive: '30 mins ago', joinDate: 'Feb 15, 2024' },
  { id: 9, name: 'Tom Anderson', email: 'tom@acme.com', company: 'Acme Corporation', role: 'User', status: 'Active', lastActive: '6 hours ago', joinDate: 'Jan 22, 2024' },
  { id: 10, name: 'Jessica White', email: 'jwhite@techstart.com', company: 'TechStart Inc', role: 'User', status: 'Active', lastActive: '2 days ago', joinDate: 'Dec 15, 2023' },
];

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const totalUsers = usersData.length;
  const activeUsers = usersData.filter(u => u.status === 'Active').length;
  const adminUsers = usersData.filter(u => u.role === 'Admin').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Total Users</h1>
          <p className="mt-2 text-gray-600">View and manage all platform users</p>
        </div>
        <button 
          onClick={() => setShowAddUserDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-semibold text-gray-900">{totalUsers.toLocaleString()}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <UsersIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-2xl font-semibold text-gray-900">{activeUsers}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Admin Users</p>
          <p className="text-2xl font-semibold text-gray-900">{adminUsers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setRoleFilter('all')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              roleFilter === 'all'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Roles
          </button>
          <button 
            onClick={() => setRoleFilter('admin')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              roleFilter === 'admin'
                ? 'border-purple-200 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Admins
          </button>
          <button 
            onClick={() => setRoleFilter('user')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              roleFilter === 'user'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Users
          </button>
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
            All Status
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setStatusFilter('suspended')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'suspended'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                      user.role === 'Admin' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {user.role === 'Admin' && <Shield className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewUser(user)}
                      className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors"
                    >
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">No users found matching your search criteria</p>
          </div>
        )}
      </div>

      {/* View User Dialog */}
      {showViewDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewDialog(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Company</p>
                  <p className="font-medium text-gray-900">{selectedUser.company}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="font-medium text-gray-900">{selectedUser.role}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedUser.status} variant="compact" />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Last Active</p>
                  <p className="font-medium text-gray-900">{selectedUser.lastActive}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Join Date</p>
                  <p className="font-medium text-gray-900">{selectedUser.joinDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowViewDialog(false)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      {showAddUserDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddUserDialog(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Acme Corporation</option>
                  <option>TechStart Inc</option>
                  <option>Global Dynamics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>User</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddUserDialog(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('User added successfully');
                    setShowAddUserDialog(false);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

