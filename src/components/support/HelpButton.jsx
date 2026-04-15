"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy, Send, X } from "lucide-react";

import { createSupportTicket } from "@/lib/supportTickets";

const initialForm = {
  title: "",
  priority: "Medium",
  description: "",
};

export default function HelpButton({
  dashboardName,
  clientName,
  requesterName,
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setIsSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setError("Please enter an issue title and description.");
      return;
    }

    createSupportTicket({
      title: form.title,
      description: form.description,
      priority: form.priority,
      dashboard: dashboardName,
      clientName,
      requesterName,
    });

    setForm(initialForm);
    setError("");
    setIsSubmitted(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl ${buttonClassName}`}
      >
        <LifeBuoy className="h-4 w-4" />
        Help
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-600">{dashboardName} Dashboard</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Need help?</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Share the issue here and it will appear in the admin Issues section.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
                <p className="mt-3 text-base font-semibold text-emerald-800">Issue submitted</p>
                <p className="mt-1 text-sm text-emerald-700">
                  The admin team can now see this ticket in the Issues list.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                  Issue Title
                  <input
                    value={form.title}
                    onChange={(event) => handleChange("title", event.target.value)}
                    placeholder="Enter issue title"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) => handleChange("priority", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {["Low", "Medium", "High", "Critical"].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) => handleChange("description", event.target.value)}
                    placeholder="Describe what happened and what you expected."
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Send className="h-4 w-4" />
                    Submit Issue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
