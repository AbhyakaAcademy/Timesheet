import { X, Clock, User, AlertCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from './StatusBadge';

export function TicketDetailDialog({ issue, isOpen, onClose }) {
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  if (!isOpen || !issue) return null;

  const handleUpdateStatus = () => {
    setShowUpdateStatus(true);
  };

  const handleReassign = () => {
    setShowReassign(true);
  };

  const handleAddNote = () => {
    setShowAddNote(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold text-gray-900">{issue.title}</h2>
              </div>
              <p className="text-sm text-gray-500 font-mono">{issue.id}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">Priority</p>
              </div>
              <StatusBadge status={issue.priority} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">Status</p>
              </div>
              <StatusBadge status={issue.status} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Assigned To</p>
                <p className="font-medium text-gray-900">{issue.assignedTo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="font-medium text-gray-900">{issue.createdDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="font-medium text-gray-900">{issue.clientName}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">
              This issue was reported by {issue.clientName} and is currently being handled by {issue.assignedTo}. 
              The ticket has been classified as {issue.priority.toLowerCase()} priority and is currently {issue.status.toLowerCase()}.
            </p>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Activity Timeline</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0">
                  {issue.assignedTo.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.assignedTo} was assigned</p>
                  <p className="text-xs text-gray-500">{issue.createdDate}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-semibold flex-shrink-0">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ticket created</p>
                  <p className="text-xs text-gray-500">{issue.createdDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              onClick={handleUpdateStatus}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Update Status
            </button>
            <button 
              onClick={handleReassign}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reassign
            </button>
            <button 
              onClick={handleAddNote}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Update Status Dialog */}
      {showUpdateStatus && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  alert('Status updated to: Open');
                  setShowUpdateStatus(false);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Open
              </button>
              <button
                onClick={() => {
                  alert('Status updated to: In Progress');
                  setShowUpdateStatus(false);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                In Progress
              </button>
              <button
                onClick={() => {
                  alert('Status updated to: Resolved');
                  setShowUpdateStatus(false);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Resolved
              </button>
              <button
                onClick={() => {
                  alert('Status updated to: Closed');
                  setShowUpdateStatus(false);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Closed
              </button>
            </div>
            <button
              onClick={() => setShowUpdateStatus(false)}
              className="w-full mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reassign Dialog */}
      {showReassign && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reassign Ticket</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>John Smith</option>
                <option>Sarah Wilson</option>
                <option>Mike Johnson</option>
                <option>Emily Davis</option>
                <option>Alex Chen</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReassign(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Ticket reassigned successfully');
                    setShowReassign(false);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Dialog */}
      {showAddNote && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
            <div className="space-y-3">
              <textarea
                placeholder="Type your note here..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Note added successfully');
                    setShowAddNote(false);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}