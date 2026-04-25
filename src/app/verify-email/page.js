"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { verifyTenantEmail } from "@/lib/signup";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(Boolean(token));
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() => (token ? "" : "Missing verification token."));

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    verifyTenantEmail(token)
      .then((response) => {
        if (!active) return;
        setMessage(response?.message || "Email verified successfully.");
        window.setTimeout(() => {
          router.push("/login");
        }, 2500);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Verification failed.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Verify your email</h1>
              <p className="text-sm text-slate-500">Finish creating your tenant account</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Verifying your account...
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
              {message}
              <p className="mt-2 text-sm text-emerald-700">Redirecting you to login shortly.</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="mt-2 text-sm text-rose-600">
                    Try signing up again or request a new verification email.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && !message && !error ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700">
              We are waiting for your verification link.
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Back to signup
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
