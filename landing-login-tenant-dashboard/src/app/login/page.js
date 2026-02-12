"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, Eye, EyeOff, Loader2, Shield, Circle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const showInfo = (msg) => window.alert(msg);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] relative">
      <div className="pt-8 px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
      <div className="min-h-[calc(100vh-56px)] flex">
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 p-12 xl:p-14 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
              <Clock3 className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl leading-none text-white font-semibold">Abhyaka</h1>
              <p className="text-xs text-indigo-100">Time Intelligence</p>
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

        <div />
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-indigo-600" onClick={() => showInfo("Password reset link sent to your email.")}>
                Forgot password?
              </button>
            </div>

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

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Secure login - SOC 2 Certified
              </p>
            </div>
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
