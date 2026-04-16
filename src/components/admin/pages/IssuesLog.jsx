import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../StatusBadge';
import { TicketDetailDialog } from '../TicketDetailDialog';
import { issuesData } from '@/data/admin/mockData';
import { getSupportTickets, subscribeToSupportTickets, updateSupportTicket } from '@/lib/supportTickets';
import { getAdminDashboardSlice, setAdminDashboardSlice } from '@/lib/adminDashboardStorage';

export function IssuesLog() {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [submittedIssues, setSubmittedIssues] = useState(() => getSupportTickets());
  const [managedIssues, setManagedIssues] = useState(() => getAdminDashboardSlice('managedIssues', {}));

  useEffect(() => subscribeToSupportTickets(setSubmittedIssues), []);

  const allIssues = useMemo(() => {
    const sourceIssues = [...submittedIssues, ...issuesData];
    return sourceIssues
      .map((issue) => ({ ...issue, ...(managedIssues[issue.id] || {}) }))
      .sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')));
  }, [managedIssues, submittedIssues]);

  const filteredIssues = allIssues.filter((issue) => {
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

  const handleViewTicket = (issue) => {
    setSelectedIssue(issue);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedIssue(null);
  };

  const handleIssueUpdate = (issueId, updates) => {
    const syncedTicket = updateSupportTicket(issueId, updates);
    const nextManagedIssues = {
      ...managedIssues,
      [issueId]: {
        ...(managedIssues[issueId] || {}),
        ...updates,
      },
    };
    setManagedIssues(nextManagedIssues);
    setAdminDashboardSlice('managedIssues', nextManagedIssues);
    setSubmittedIssues((prev) => (syncedTicket ? prev.map((issue) => (issue.id === issueId ? syncedTicket : issue)) : prev));
    setSelectedIssue((prev) => (prev && prev.id === issueId ? { ...prev, ...updates } : prev));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Issues Log</h1>
        <p className="mt-2 text-gray-600">Track and manage customer issues and support tickets</p>
      </div>

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
          {[
            ['all', 'All', 'border-blue-200 bg-blue-50 text-blue-700'],
            ['critical', 'Critical', 'border-red-200 bg-red-50 text-red-700'],
            ['high', 'High Priority', 'border-orange-200 bg-orange-50 text-orange-700'],
            ['open', 'Open', 'border-yellow-200 bg-yellow-50 text-yellow-700'],
          ].map(([key, label, activeClasses]) => (
            <button
              key={key}
              onClick={() => setPriorityFilter(key)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                priorityFilter === key
                  ? activeClasses
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono text-sm font-medium text-gray-900">{issue.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{issue.title}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{issue.clientName}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={issue.priority} variant="compact" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={issue.status} variant="compact" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{issue.assignedTo}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{issue.createdDate}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => handleViewTicket(issue)}
                      className="mr-3 font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleIssueUpdate(issue.id, { assignedTo: 'Support Queue', status: 'In Progress' })}
                      className="font-medium text-gray-600 transition-colors hover:text-gray-700"
                    >
                      Assign
                    </button>
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

      <TicketDetailDialog
        issue={selectedIssue}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onUpdateIssue={handleIssueUpdate}
      />
    </div>
  );
}
