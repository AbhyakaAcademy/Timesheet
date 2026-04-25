"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Check
} from "lucide-react";
import { requestTenantSignup } from "@/lib/signup";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [organizationError, setOrganizationError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // ---------------- VALIDATIONS ----------------

  const validateEmail = (value) => {
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateOrganization = (value) => {
    if (!value?.trim()) {
      setOrganizationError("Organization name is required");
      return false;
    }
    setOrganizationError("");
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (/\s/.test(value)) {
      setPasswordError("Password cannot contain spaces");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError("Password must include at least one uppercase letter");
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      setPasswordError("Password must include at least one special character");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const emailValid = validateEmail(email);
    const organizationValid = validateOrganization(organizationName);
    const passwordValid = validatePassword(password);
    const confirmValid = validateConfirmPassword(confirmPassword);

    if (!emailValid || !organizationValid || !passwordValid || !confirmValid) return;

    setIsLoading(true);

    requestTenantSignup({
      email,
      password,
      confirm_password: confirmPassword,
      organization_name: organizationName,
    })
      .then((response) => {
        setSuccessMessage(
          response?.message ||
            "We sent a verification email. Please check your inbox before signing in."
        );
      })
      .catch((error) => {
        setFormError(error.message || "Signup failed.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    { label: "Passwords match", met: password && confirmPassword && password === confirmPassword }
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="min-h-[calc(100vh-56px)] flex">
      {/* LEFT BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Clock className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl text-white">Abhyaka</h1>
              <p className="text-xs text-indigo-200">Time Intelligence</p>
            </div>
          </Link>
        </div>

        <div>
          <h2 className="text-4xl text-white mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-indigo-100 mb-8">
            Join 10,000+ enterprises worldwide.
          </p>

          {[
            "30-day free trial - No credit card required",
            "Complete timesheet & project tracking",
            "Multi-level approval workflows",
            "Enterprise-grade security"
          ].map((item) => (
            <div key={item} className="flex gap-3 text-indigo-50 mb-3">
              <span>-</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-indigo-200">
          Trusted by 10,000+ enterprises worldwide
        </p>
      </div>

      {/* RIGHT FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 mb-8">
              Start your 30-day free trial. No credit card required.
            </p>

            {formError ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {successMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ORGANIZATION */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => {
                    setOrganizationName(e.target.value);
                    if (organizationError) validateOrganization(e.target.value);
                  }}
                  onBlur={(e) => validateOrganization(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    organizationError
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-gray-300 focus:ring-indigo-500/20"
                  }`}
                  placeholder="Your company or tenant name"
                />
                {organizationError && <p className="text-red-600 text-sm mt-1">{organizationError}</p>}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-gray-300 focus:ring-indigo-500/20"
                  }`}
                  placeholder="name@company.com"
                />
                {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  className="no-password-reveal w-full px-4 py-3 border rounded-lg pr-12"
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
                  </button>
                </div>
                {passwordError && <p className="text-red-600 text-sm mt-1">{passwordError}</p>}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) validateConfirmPassword(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  onBlur={(e) => validateConfirmPassword(e.target.value)}
                  className="no-password-reveal w-full px-4 py-3 border rounded-lg pr-12"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <Eye /> : <EyeOff />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-red-600 text-sm mt-1">{confirmPasswordError}</p>
                )}
              </div>

              {/* PASSWORD CHECKS */}
              {password && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${check.met ? "bg-green-500" : "bg-gray-300"} flex items-center justify-center`}>
                        {check.met && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm">{check.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg flex justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="animate-spin" /> Creating...</> : "Create Account"}
              </button>

              {/* SSO */}
              <button
                type="button"
                onClick={() => window.alert("SSO sign-up flow started.")}
                className="w-full border py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Shield />
                Sign up with SSO
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
