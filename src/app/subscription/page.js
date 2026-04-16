"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Users
} from "lucide-react";

const plans = [
  {
    key: "starter",
    name: "Starter",
    description: "Small teams",
    monthlyMin: 149,
    monthlyMax: 249,
    annualMin: 1520,
    annualMax: 2540,
    features: ["Time capture", "Projects", "Manager approvals", "Basic reports", "CSV export"]
  },
  {
    key: "professional",
    name: "Professional",
    description: "For growing organizations",
    monthlyMin: 349,
    monthlyMax: 599,
    annualMin: 3560,
    annualMax: 6110,
    features: [
      "Up to 100 users",
      "Advanced analytics",
      "Custom workflows",
      "Priority support",
      "API access",
      "Single Sign-On"
    ]
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For large enterprises",
    monthly: null,
    annual: null,
    custom: true,
    features: [
      "Unlimited users",
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Advanced security"
    ]
  }
];

const regionMeta = {
  IN: { label: "India", symbol: "\u20B9", code: "INR", locale: "en-IN", multiplier: 1 },
  US: { label: "United States", symbol: "$", code: "USD", locale: "en-US", multiplier: 0.012 },
  UK: { label: "United Kingdom", symbol: "\u00A3", code: "GBP", locale: "en-GB", multiplier: 0.0095 }
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [billing, setBilling] = useState("annual");
  const [region, setRegion] = useState("IN");
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [form, setForm] = useState({
    companyName: "",
    users: "",
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "Credit Card",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  const activePlan = useMemo(
    () => plans.find((p) => p.key === selectedPlan) || plans[1],
    [selectedPlan]
  );

  const userCount = Number.parseInt(form.users, 10) || 1;

  const convertAmount = (value) => Math.round(value * regionMeta[region].multiplier);
  const formatAmount = (value) =>
    `${regionMeta[region].symbol}${value.toLocaleString(regionMeta[region].locale)}`;
  const formatRange = (min, max) => `${formatAmount(min)}-${formatAmount(max)}`;

  const activePriceRange = activePlan.custom
    ? null
    : billing === "annual"
      ? {
          min: convertAmount(activePlan.annualMin),
          max: convertAmount(activePlan.annualMax),
        }
      : {
          min: convertAmount(activePlan.monthlyMin),
          max: convertAmount(activePlan.monthlyMax),
        };

  const totalRange = activePlan.custom || !activePriceRange
    ? null
    : {
        min: activePriceRange.min * userCount,
        max: activePriceRange.max * userCount,
      };

  const monthlyEquivalentRange = activePlan.custom
    ? null
    : {
        min: convertAmount(activePlan.monthlyMin),
        max: convertAmount(activePlan.monthlyMax),
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => router.push("/dashboard"), 800);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="relative z-20 px-6 py-2 bg-white border-b border-slate-200">
        <div className="max-w-[1580px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] leading-[0.95] tracking-[-0.03em] font-semibold text-slate-900">Abhyaka</h1>
              <p className="text-[11px] leading-[0.95] tracking-[-0.02em] text-slate-600">Time Intelligence</p>
            </div>
          </Link>

          <div className="text-[16px] text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[16px] font-semibold text-slate-700 hover:text-slate-900">
              Log In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1560px] mx-auto py-10 px-6">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-center text-gray-600 mb-8">Start your 30-day free trial today with no credit card required</p>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-8 flex items-center gap-3">
          <p className="text-slate-700 text-sm ml-2">Choose Region:</p>
          {Object.entries(regionMeta).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRegion(key)}
              className={`px-4 py-2 rounded-xl text-sm ${region === key ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {value.label}
            </button>
          ))}
          <span className="ml-auto mr-2 text-sm text-slate-500">{regionMeta[region].code}</span>
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative bg-white rounded-2xl shadow-md p-1.5 inline-flex border border-gray-200">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`px-10 py-3 rounded-xl text-lg ${
                billing === "monthly" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`px-10 py-3 rounded-xl text-lg ${
                billing === "annual" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "text-gray-700"
              }`}
            >
              Annual
            </button>
            <span className="absolute -top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
              Save 15%
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-1">Free Trial</p>
            <p className="text-sm text-slate-600">14-30 days available. Recommended setup: 30-day free trial with no credit card required.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-1">Annual Billing</p>
            <p className="text-sm text-slate-600">Annual plans include a 15% discount to improve retention and cash flow.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-1">Proration</p>
            <p className="text-sm text-slate-600">Mid-cycle upgrades and downgrades apply automatic credits or charges based on the unused balance.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => {
            const selected = selectedPlan === plan.key;
            const price = plan.custom
              ? billing === "annual"
                ? "Custom per year"
                : "Custom per month"
              : billing === "annual"
                ? formatRange(convertAmount(plan.annualMin), convertAmount(plan.annualMax))
                : formatRange(convertAmount(plan.monthlyMin), convertAmount(plan.monthlyMax));
            const suffix = plan.custom ? "" : billing === "annual" ? "/user/yr" : "/user/mo";

            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                className={`text-left bg-white rounded-3xl p-8 shadow-md border-2 transition-all duration-200 hover:border-indigo-600 hover:shadow-2xl hover:-translate-y-1 ${
                  selected ? "border-indigo-600" : "border-transparent"
                }`}
              >
                {selected && (
                  <div className="text-center mb-6">
                    <span className="px-5 py-1.5 text-white rounded-full text-sm bg-gradient-to-r from-indigo-600 to-purple-600">
                      Selected
                    </span>
                  </div>
                )}
                <h2 className="text-[30px] font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-gray-600 mb-7">{plan.description}</p>
                <div className="mb-8">
                  <span className={`${plan.custom ? "text-2xl" : "text-3xl"} font-bold text-gray-900`}>{price}</span>
                  {suffix && <span className="text-gray-500 text-xl">{suffix}</span>}
                  {!plan.custom && billing === "annual" && (
                    <p className="text-sm text-emerald-600 mt-3">Annual billing includes 15% savings.</p>
                  )}
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-gray-600 text-lg">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="max-w-[1020px] mx-auto bg-white rounded-3xl shadow-md p-8 border border-gray-200">
          <h3 className="text-2xl text-gray-900 mb-7">Complete Your Subscription</h3>

          <div className="mb-7">
            <div className="flex items-center gap-3 text-gray-900 text-xl mb-4">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Company Information
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Company Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Number of Users *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                  value={form.users}
                  onChange={(e) => handleChange("users", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-7">
            <div className="flex items-center gap-3 text-gray-900 text-xl mb-4">
              <Users className="w-6 h-6 text-indigo-600" />
              Contact Information
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Full Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3.5"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Phone Number *</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3.5"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-7">
            <div className="flex items-center gap-3 text-gray-900 text-xl mb-4">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Payment Information
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select Payment Method *</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 bg-white"
                value={form.paymentMethod}
                onChange={(e) => handleChange("paymentMethod", e.target.value)}
              >
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>UPI</option>
                <option>Net Banking</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Card Number *</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                value={form.cardNumber}
                onChange={(e) => handleChange("cardNumber", e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Expiry Date *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                  value={form.expiry}
                  onChange={(e) => handleChange("expiry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">CVV *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5"
                  value={form.cvv}
                  onChange={(e) => handleChange("cvv", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-7">
            <h4 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Order Summary</h4>
            <div className="space-y-3 text-gray-700 text-base">
              <div className="flex justify-between">
                <span>Plan: {activePlan.name}</span>
                <span>
                  {activePlan.custom || !activePriceRange
                    ? "Custom"
                    : `${formatRange(activePriceRange.min, activePriceRange.max)}/user`}
                </span>
              </div>
              <div className="flex justify-between"><span>Billing Cycle:</span><span>{billing === "annual" ? "Annual" : "Monthly"}</span></div>
              <div className="flex justify-between"><span>Region:</span><span>{regionMeta[region].label}</span></div>
              <div className="flex justify-between"><span>Number of Users:</span><span>{userCount}</span></div>
              {billing === "annual" && (
                <>
                  <div className="flex justify-between text-emerald-600"><span>Discount (Annual):</span><span>-15%</span></div>
                  {monthlyEquivalentRange && (
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly list price:</span>
                      <span>{formatRange(monthlyEquivalentRange.min, monthlyEquivalentRange.max)}/user</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between"><span>Free Trial:</span><span>30 days, no card required</span></div>
              <div className="flex justify-between"><span>Proration:</span><span>Applied automatically</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-300 flex justify-between text-2xl font-semibold text-gray-900">
              <span>Total:</span>
              <span>
                {activePlan.custom
                  ? "Contact Sales"
                  : totalRange
                    ? `${formatRange(totalRange.min, totalRange.max)}/${billing === "annual" ? "year" : "month"}`
                    : "Custom"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl text-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            Complete Subscription
          </button>
        </form>
      </div>
    </div>
  );
}
