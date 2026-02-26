import { Filter, Search } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../StatusBadge';
import { TicketDetailDialog } from '../TicketDetailDialog';
import { issuesData } from '@/data/admin/mockData';

export function IssuesLog() {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const handleViewTicket = (issue) => {
    setSelectedIssue(issue);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedIssue(null);
  };

  // Filter issues based on search and priority
  const filteredIssues = issuesData.filter((issue) => {
    const matchesSearch = 
      issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = 
      priorityFilter === 'all' || 
      issue.priority.toLowerCase() === priorityFilter.toLowerCase() ||
      (priorityFilter === 'open' && issue.status.toLowerCase() === 'open');
    
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Issues Log</h1>
        <p className="mt-2 text-gray-600">Track and manage customer issues and support tickets</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPriorityFilter('all')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              priorityFilter === 'all'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setPriorityFilter('critical')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              priorityFilter === 'critical'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Critical
          </button>
          <button 
            onClick={() => setPriorityFilter('high')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              priorityFilter === 'high'
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            High Priority
          </button>
          <button 
            onClick={() => setPriorityFilter('open')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              priorityFilter === 'open'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Open
          </button>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">{issue.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{issue.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={issue.priority} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={issue.status} variant="compact" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.assignedTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{issue.createdDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewTicket(issue)}
                      className="text-blue-600 hover:text-blue-700 font-medium mr-3 transition-colors"
                    >
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredIssues.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">No issues found matching your search criteria</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog
        issue={selectedIssue}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
