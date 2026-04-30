"use client";

import { useCallback, useEffect, useState } from "react";

import DashboardFrame from "@/components/dashboard/DashboardFrame";
import Table from "@/components/dashboard/Table";
import { apiFetch } from "@/lib/api";

const requestStatusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const requestStatusTone = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatDisplayDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeLocalValue(dateValue, timeValue) {
  return `${dateValue}T${timeValue}`;
}

export default function TeamPage() {
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("PENDING");
  const [projects, setProjects] = useState([]);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [decisionForm, setDecisionForm] = useState({
    projectId: "",
    startTime: "",
    endTime: "",
    note: "",
    managerComment: "",
  });

  const loadRequests = useCallback(async () => {
    setErrorMessage("");
    setLoadingRequests(true);
    try {
      const [requestsRes, projectsRes] = await Promise.all([
        apiFetch(`/manager/manual-entry-requests?status=${requestFilter}`),
        apiFetch("/projects"),
      ]);
      setRequests(requestsRes || []);
      setProjects(projectsRes || []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load manual entry requests.");
    } finally {
      setLoadingRequests(false);
    }
  }, [requestFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openRequest = (request) => {
    const requestDate = request.request_date;
    setExpandedRequestId((current) => (current === request.id ? null : request.id));
    setDecisionForm({
      projectId: "",
      startTime: formatDateTimeLocalValue(requestDate, "09:00"),
      endTime: formatDateTimeLocalValue(requestDate, "18:00"),
      note: "",
      managerComment: "",
    });
  };

  const handleApprove = async (requestId) => {
    if (!decisionForm.projectId || !decisionForm.startTime || !decisionForm.endTime) {
      setErrorMessage("Project, start time, and end time are required to approve this request.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      await apiFetch(`/manager/manual-entry-requests/${requestId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          project_id: Number(decisionForm.projectId),
          start_time: new Date(decisionForm.startTime).toISOString(),
          end_time: new Date(decisionForm.endTime).toISOString(),
          note: decisionForm.note,
          manager_comment: decisionForm.managerComment,
        }),
      });
      setExpandedRequestId(null);
      await loadRequests();
    } catch (error) {
      setErrorMessage(error.message || "Unable to approve request.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!decisionForm.managerComment.trim()) {
      setErrorMessage("Please add a manager comment before rejecting this request.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      await apiFetch(`/manager/manual-entry-requests/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({
          manager_comment: decisionForm.managerComment.trim(),
        }),
      });
      setExpandedRequestId(null);
      await loadRequests();
    } catch (error) {
      setErrorMessage(error.message || "Unable to reject request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardFrame>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Missed Punch Requests</h2>
              <p className="mt-1 text-sm text-gray-500">
                Employees can now raise a manual entry request with project and time details. Review the information carefully before approving it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRequestFilter(status)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    requestFilter === status
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {requestStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
          {loadingRequests ? <p className="text-sm text-gray-600">Loading manual entry requests...</p> : null}

          <div className="space-y-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{request.employee_name || request.employee_username}</p>
                      <span className="text-sm text-gray-400">-</span>
                      <p className="text-sm text-gray-600">{request.request_type}</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Request date: {formatDisplayDate(request.request_date)}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{request.comment}</p>
                    {request.manager_comment ? (
                      <p className="mt-2 text-xs text-gray-500">Manager comment: {request.manager_comment}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${requestStatusTone[request.status] || "border-gray-200 bg-gray-100 text-gray-700"}`}>
                      {requestStatusLabels[request.status] || request.status}
                    </span>
                    {request.status === "PENDING" ? (
                      <button
                        type="button"
                        onClick={() => openRequest(request)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        {expandedRequestId === request.id ? "Hide Review" : "Review Request"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {expandedRequestId === request.id ? (
                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Project</label>
                        <select
                          value={decisionForm.projectId}
                          onChange={(event) => setDecisionForm((prev) => ({ ...prev, projectId: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        >
                          <option value="">Select project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name} ({project.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Manager note</label>
                        <input
                          value={decisionForm.note}
                          onChange={(event) => setDecisionForm((prev) => ({ ...prev, note: event.target.value }))}
                          placeholder="Optional note for the created manual entry"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Start time</label>
                        <input
                          type="datetime-local"
                          value={decisionForm.startTime}
                          onChange={(event) => setDecisionForm((prev) => ({ ...prev, startTime: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">End time</label>
                        <input
                          type="datetime-local"
                          value={decisionForm.endTime}
                          onChange={(event) => setDecisionForm((prev) => ({ ...prev, endTime: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-600">Manager comment</label>
                        <textarea
                          value={decisionForm.managerComment}
                          onChange={(event) => setDecisionForm((prev) => ({ ...prev, managerComment: event.target.value }))}
                          placeholder="Add a short manager comment for approve or reject."
                          className="mt-1 min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedRequestId(null)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReject(request.id)}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApprove(request.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Approve and Add Manual Entry
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}

            {!loadingRequests && requests.length === 0 ? (
              <p className="text-sm text-gray-500">No {requestStatusLabels[requestFilter].toLowerCase()} manual entry requests right now.</p>
            ) : null}
          </div>
        </div>
      </DashboardFrame>

      <DashboardFrame>
        <Table onPendingCountChange={() => {}} />
      </DashboardFrame>
    </div>
  );
}
