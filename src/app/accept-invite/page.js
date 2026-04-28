"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, ShieldAlert } from "lucide-react";
import { acceptInvitation, getInvitationStatus } from "@/lib/signup";
import { getRoleHome, persistSession } from "@/lib/auth";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState(() => (token ? "" : "Missing invitation token."));
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    getInvitationStatus(token)
      .then((response) => {
        if (!active) return;
        setInvite(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Unable to load invitation.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const payload = await acceptInvitation({
        token,
        password,
        confirm_password: confirmPassword,
      });
      persistSession(payload);
      setMessage(payload?.message || "Invitation accepted successfully.");
      const target = getRoleHome(payload?.user?.role);
      window.setTimeout(() => {
        router.replace(target);
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to accept invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Accept your invite</h1>
              <p className="text-sm text-slate-500">Set your password to activate your account</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Loading your invitation...
            </div>
          ) : null}

          {invite ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              <p className="font-semibold text-slate-950">{invite.name}</p>
              <p className="mt-1 text-sm">{invite.email}</p>
              <p className="mt-1 text-sm">
                Role: <span className="font-medium capitalize">{invite.role}</span>
              </p>
              <p className="mt-1 text-sm">Organization: {invite.organization_name}</p>
            </div>
          ) : null}

          {message ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">{message}</p>
                  <p className="mt-2 text-sm text-emerald-700">Redirecting you to your dashboard.</p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="mt-2 text-sm text-rose-600">
                    Ask your tenant admin to send a fresh invite if this link is no longer valid.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && invite && !message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Create password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12"
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white"
              >
                {submitting ? "Activating account..." : "Activate account"}
              </button>
            </form>
          ) : null}

          <div className="mt-6 text-sm">
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
