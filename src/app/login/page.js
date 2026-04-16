"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock3, Eye, EyeOff, Loader2, Shield, Circle } from "lucide-react";
import { getRoleHome, loginWithCredentials, persistSession, ROLE_DASHBOARD_MAP } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const showInfo = (msg) => window.alert(msg);

  useEffect(() => {
    Object.values(ROLE_DASHBOARD_MAP).forEach((path) => {
      router.prefetch(path);
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setErrorMessage("");
    setIsLoading(true);

    try {
      const payload = await loginWithCredentials({ username, password });
      persistSession(payload);
      const target = getRoleHome(payload.user.role);
      router.prefetch(target);
      router.replace(target);
    } catch (error) {
      setErrorMessage(error.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotEmail(username);
    setShowForgotModal(true);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showInfo("Please enter your email ID.");
      return;
    }
    showInfo(`Password reset link sent to ${forgotEmail}.`);
    setShowForgotModal(false);
    setForgotEmail("");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] relative">
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your email ID to receive a password reset link.</p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <input
                type="email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 border border-gray-300 rounded-xl py-3 text-gray-700"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 p-12 xl:p-14 flex-col justify-start gap-10">
        <div>
          <Link href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
              <Clock3 className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl leading-none text-white font-semibold">Abhyaka</h1>
              <p className="text-[11px] text-indigo-100">Time Intelligence</p>
            </div>
          </Link>
        </div>

        <div>
          <h2 className="text-4xl leading-[1.05] text-white font-semibold mb-8">
            Enterprise Time Management,
            <br />
            Simplified
          </h2>
          <p className="text-indigo-100 mb-10 max-w-[900px]">
            Track hours, manage approvals, and generate GST-ready invoices-all in one secure platform trusted by leading organizations.
          </p>

          <div className="space-y-4 text-indigo-50">
            {[
              "Real-time time tracking & reporting",
              "Multi-level approval workflows",
              "GST-compliant invoice generation",
              "Enterprise-grade security & compliance"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Circle className="w-3.5 h-3.5 fill-indigo-100 text-indigo-100" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[560px] bg-white rounded-2xl border border-gray-200 p-8 md:p-10 shadow-sm">
          <h2 className="text-3xl leading-tight text-gray-900 font-semibold mb-3">
            Sign in to your account
          </h2>
          <p className="text-gray-600 mb-8">
            Track time, manage approvals, and generate invoices securely.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter your username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="no-password-reveal w-full border border-gray-300 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-indigo-600" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <button
              type="button"
              onClick={() => showInfo("SSO sign-in flow started.")}
              className="w-full border border-gray-300 py-3.5 rounded-xl flex items-center justify-center gap-2 text-gray-800 font-semibold"
            >
              <Shield className="w-5 h-5" />
              Sign in with SSO
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            No account?{" "}
            <Link href="/signup" className="text-indigo-600 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
