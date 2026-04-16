import { X, Clock, User, AlertCircle, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';

const assignees = ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Emily Davis', 'Alex Chen', 'Support Queue'];

export function TicketDetailDialog({ issue, isOpen, onClose, onUpdateIssue }) {
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [nextAssignee, setNextAssignee] = useState('Support Queue');
  const [noteText, setNoteText] = useState('');

  const notes = useMemo(() => issue?.notes || [], [issue]);

  if (!isOpen || !issue) return null;

  const applyUpdates = (updates) => {
    onUpdateIssue?.(issue.id, updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">{issue.title}</h2>
              </div>
              <p className="font-mono text-sm text-gray-500">{issue.id}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">Priority</p>
              </div>
              <StatusBadge status={issue.priority} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600">Status</p>
              </div>
              <StatusBadge status={issue.status} />
            </div>
          </div>

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

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-900">Description</h3>
            <p className="text-gray-600">
              {issue.description || `This issue was reported by ${issue.clientName} and is currently being handled by ${issue.assignedTo}.`}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Activity Timeline</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  {issue.assignedTo.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.assignedTo} is currently assigned</p>
                  <p className="text-xs text-gray-500">{issue.createdDate}</p>
                </div>
              </div>
              {notes.map((note, index) => (
                <div key={`${note}-${index}`} className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                    N
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{note}</p>
                    <p className="text-xs text-gray-500">Internal note</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ticket created</p>
                  <p className="text-xs text-gray-500">{issue.createdDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <button onClick={() => setShowUpdateStatus(true)} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Update Status
            </button>
            <button
              onClick={() => {
                setNextAssignee(issue.assignedTo || 'Support Queue');
                setShowReassign(true);
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Reassign
            </button>
            <button onClick={() => setShowAddNote(true)} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Add Note
            </button>
          </div>
        </div>
      </div>

      {showUpdateStatus && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Update Status</h3>
            <div className="space-y-3">
              {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    applyUpdates({ status });
                    setShowUpdateStatus(false);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {status}
                </button>
              ))}
            </div>
            <button onClick={() => setShowUpdateStatus(false)} className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReassign && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Reassign Ticket</h3>
            <div className="space-y-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Assign To</label>
              <select value={nextAssignee} onChange={(event) => setNextAssignee(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {assignees.map((assignee) => <option key={assignee}>{assignee}</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowReassign(false)} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    applyUpdates({ assignedTo: nextAssignee, status: 'In Progress' });
                    setShowReassign(false);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddNote && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add Note</h3>
            <div className="space-y-3">
              <textarea
                placeholder="Type your note here..."
                rows={4}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNoteText('');
                  }}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!noteText.trim()) return;
                    applyUpdates({ notes: [...notes, noteText.trim()] });
                    setShowAddNote(false);
                    setNoteText('');
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
