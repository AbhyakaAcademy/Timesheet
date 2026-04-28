"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { getPasswordResetStatus, resetPassword } from "@/lib/signup";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() => (token ? "" : "Missing reset token."));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    getPasswordResetStatus(token)
      .then((response) => {
        if (!active) return;
        setResetStatus(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Unable to load reset link.");
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
      const response = await resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(response?.message || "Password reset successfully.");
      window.setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-950">Reset your password</h1>
            <p className="mt-1 text-sm text-slate-500">Create a new password for your account</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Validating your reset link...
            </div>
          ) : null}

          {resetStatus ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              <p className="text-sm">Reset email: <span className="font-medium">{resetStatus.email}</span></p>
            </div>
          ) : null}

          {message ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">{message}</p>
                  <p className="mt-2 text-sm text-emerald-700">Redirecting you to login.</p>
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
                  <p className="mt-2 text-sm text-rose-600">Go back and request a new password reset link.</p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && resetStatus && !message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12"
                    placeholder="Enter your new password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12"
                    placeholder="Re-enter your new password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white"
              >
                {submitting ? "Resetting password..." : "Reset password"}
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
