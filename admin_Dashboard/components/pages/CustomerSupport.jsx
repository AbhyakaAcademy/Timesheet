import { HeadphonesIcon, Clock, TrendingUp, MessageSquare, AlertCircle, X } from 'lucide-react';
import { supportMetrics } from '../../data/mockData';
import { useState } from 'react';

export function CustomerSupport() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [responseText, setResponseText] = useState('');

  const tickets = [
    { id: 'TKT-1891', priority: 'High', client: 'Acme Corporation', subject: 'API rate limit exceeded', time: '15 mins ago', description: 'Our API calls are being rate limited at 100 requests/min but we need at least 500/min for our operations. Can you please increase our limit?', requester: 'john@acme.com' },
    { id: 'TKT-1890', priority: 'Medium', client: 'TechStart Inc', subject: 'Report export not working', time: '1 hour ago', description: 'When trying to export timesheet reports to PDF, the download fails with a 500 error. This has been happening since yesterday.', requester: 'sarah@techstart.com' },
    { id: 'TKT-1889', priority: 'Low', client: 'Design Studios', subject: 'UI alignment issue on mobile', time: '2 hours ago', description: 'The navigation menu on mobile devices is not properly aligned. Items appear cut off on iPhone 12 and Samsung Galaxy S21.', requester: 'mike@designstudios.com' },
    { id: 'TKT-1888', priority: 'Critical', client: 'Global Solutions Ltd', subject: 'Data sync failing for large datasets', time: '3 hours ago', description: 'Data synchronization is failing when we have more than 10,000 records. The process times out after 30 seconds and leaves incomplete data.', requester: 'admin@globalsolutions.com' },
  ];

  const handleRespond = (ticket) => {
    setSelectedTicket(ticket);
    setShowRespondDialog(true);
    setResponseText('');
  };

  const handleView = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewDialog(true);
  };

  const handleSendResponse = () => {
    // Here you would send the response to your backend
    alert(`Response sent to ${selectedTicket.client}!`);
    setShowRespondDialog(false);
    setResponseText('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Customer Support</h1>
        <p className="mt-2 text-gray-600">Manage support tickets and customer communications</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <HeadphonesIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.totalTickets}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Responses</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.pendingResponses}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.averageResponseTime}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Satisfaction Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.satisfactionRate}%</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Escalated Cases</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.escalatedCases}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Live Chat Requests</p>
          <p className="text-2xl font-semibold text-gray-900">{supportMetrics.liveChatRequests}</p>
        </div>
      </div>

      {/* Active Tickets */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Support Tickets</h3>
          <p className="text-sm text-gray-600">Tickets requiring immediate attention</p>
        </div>
        <div className="divide-y divide-gray-100">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-medium text-gray-900">{ticket.id}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{ticket.subject}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{ticket.client}</span>
                    <span>•</span>
                    <span>{ticket.time}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100" onClick={() => handleRespond(ticket)}>
                    Respond
                  </button>
                  <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => handleView(ticket)}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Team */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Support Team Activity</h3>
          <p className="text-sm text-gray-600">Current team member status</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Sarah Chen', role: 'Senior Support', active: 12, status: 'Online' },
            { name: 'Mike Johnson', role: 'Support Engineer', active: 8, status: 'Online' },
            { name: 'David Park', role: 'Technical Support', active: 15, status: 'Busy' },
            { name: 'Emma Wilson', role: 'Support Specialist', active: 6, status: 'Online' },
          ].map((member, index) => (
            <div key={index} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${member.status === 'Online' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Tickets</span>
                <span className="font-semibold text-gray-900">{member.active}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Respond Dialog */}
      {showRespondDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="relative w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 bg-white shadow-lg rounded-lg">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button className="bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300" onClick={() => setShowRespondDialog(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Respond to Ticket</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Ticket ID: {selectedTicket?.id}</p>
                  <p className="text-sm text-gray-500">Client: {selectedTicket?.client}</p>
                  <p className="text-sm text-gray-500">Subject: {selectedTicket?.subject}</p>
                </div>
                <div className="mt-4">
                  <textarea
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                onClick={handleSendResponse}
              >
                Send Response
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                onClick={() => setShowRespondDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {showViewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="relative w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 bg-white shadow-lg rounded-lg">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button className="bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300" onClick={() => setShowViewDialog(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Ticket Details</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Ticket ID: {selectedTicket?.id}</p>
                  <p className="text-sm text-gray-500">Client: {selectedTicket?.client}</p>
                  <p className="text-sm text-gray-500">Subject: {selectedTicket?.subject}</p>
                  <p className="text-sm text-gray-500">Priority: {selectedTicket?.priority}</p>
                  <p className="text-sm text-gray-500">Time: {selectedTicket?.time}</p>
                  <p className="text-sm text-gray-500">Requester: {selectedTicket?.requester}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description:</p>
                  <p className="text-sm text-gray-900">{selectedTicket?.description}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}