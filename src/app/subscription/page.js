"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
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

const paymentConfigByRegion = {
  IN: {
    cardBrands: ["Visa", "RuPay"],
    banks: ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other Bank"],
    methods: [
      { name: "Credit/Debit Card", description: "Visa, Mastercard, RuPay, Amex" },
      { name: "Google Pay", description: "Pay securely with GPay" },
      { name: "UPI", description: "UPI ID or QR payment" },
      { name: "Net Banking", description: "Indian bank login" },
      { name: "Bank Transfer", description: "NEFT, RTGS, or IMPS transfer" },
      { name: "PayPal", description: "Use your PayPal account" },
    ],
  },
  US: {
    cardBrands: ["Visa", "Mastercard", "American Express", "Discover"],
    banks: ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Capital One", "US Bank", "Other Bank"],
    methods: [
      { name: "Credit/Debit Card", description: "Visa, Mastercard, Amex, Discover" },
      { name: "Google Pay", description: "Pay securely with GPay" },
      { name: "PayPal", description: "Use your PayPal account" },
      { name: "Net Banking", description: "Online bank payment" },
      { name: "Bank Transfer", description: "ACH or wire transfer" },
    ],
  },
  UK: {
    cardBrands: ["Visa", "Mastercard", "Maestro"],
    banks: ["Barclays", "HSBC UK", "Lloyds Bank", "NatWest", "Santander UK", "Monzo", "Other Bank"],
    methods: [
      { name: "Credit/Debit Card", description: "Visa, Mastercard, Amex" },
      { name: "Google Pay", description: "Pay securely with GPay" },
      { name: "PayPal", description: "Use your PayPal account" },
      { name: "Net Banking", description: "UK online banking" },
      { name: "Bank Transfer", description: "Faster Payments or bank transfer" },
    ],
  },
};

function getCardBrand(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "American Express";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (digits.startsWith("6")) return "Discover";
  if (digits.startsWith("8")) return "RuPay";
  return "Card type";
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : "";
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function CardLogo({ name, active }) {
  const baseClass = "inline-flex h-7 w-11 items-center justify-center overflow-hidden rounded shadow-sm ring-1 ring-slate-200 transition";
  const inactiveClass = active === false ? "opacity-40 grayscale" : "";

  if (name === "Mastercard") {
    return (
      <span className={`${baseClass} bg-[#111827] ${inactiveClass}`} aria-label="Mastercard">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <circle cx="18" cy="14" r="8.5" fill="#eb001b" />
          <circle cx="26" cy="14" r="8.5" fill="#f79e1b" />
          <path d="M22 7.5a8.5 8.5 0 0 1 0 13 8.5 8.5 0 0 1 0-13Z" fill="#ff5f00" />
        </svg>
      </span>
    );
  }

  if (name === "Discover") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="Discover">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <path d="M28 4h12v20H28a10 10 0 0 0 0-20Z" fill="#f58220" opacity="0.95" />
          <text x="5" y="16.5" fill="#111827" fontSize="6.2" fontWeight="800" fontFamily="Arial, sans-serif">DISC</text>
          <text x="23" y="16.5" fill="#111827" fontSize="6.2" fontWeight="800" fontFamily="Arial, sans-serif">VER</text>
        </svg>
      </span>
    );
  }

  if (name === "American Express") {
    return (
      <span className={`${baseClass} bg-[#2e9fd8] ${inactiveClass}`} aria-label="American Express">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#2e9fd8" />
          <text x="22" y="12" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">AM</text>
          <text x="22" y="21" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">EX</text>
        </svg>
      </span>
    );
  }

  if (name === "RuPay") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="RuPay">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <text x="18" y="17" textAnchor="middle" fill="#1f5aa6" fontSize="9" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">Ru</text>
          <text x="30" y="17" textAnchor="middle" fill="#0f9d58" fontSize="9" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">Pay</text>
          <path d="M34 7l5 7-5 7h3l5-7-5-7h-3Z" fill="#f58220" />
        </svg>
      </span>
    );
  }

  if (name === "Maestro") {
    return (
      <span className={`${baseClass} bg-white ${inactiveClass}`} aria-label="Maestro">
        <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
          <rect width="44" height="28" rx="3" fill="#ffffff" />
          <circle cx="18" cy="12" r="7.5" fill="#009ddd" />
          <circle cx="26" cy="12" r="7.5" fill="#ed1c24" />
          <path d="M22 6.5a7.5 7.5 0 0 1 0 11 7.5 7.5 0 0 1 0-11Z" fill="#6c6bff" opacity="0.85" />
          <text x="22" y="23" textAnchor="middle" fill="#111827" fontSize="6" fontWeight="800" fontFamily="Arial, sans-serif">maestro</text>
        </svg>
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-[#064f96] ${inactiveClass}`} aria-label="Visa">
      <svg viewBox="0 0 44 28" className="h-full w-full" role="img" aria-hidden="true">
        <rect width="44" height="28" rx="3" fill="#064f96" />
        <text x="22" y="18" textAnchor="middle" fill="#ffffff" fontSize="12" fontStyle="italic" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">VISA</text>
      </svg>
    </span>
  );
}

function CardLogoStrip({ brands, activeBrand }) {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
      {brands.map((brand) => (
        <CardLogo
          key={brand}
          name={brand}
          active={!activeBrand || activeBrand === "Card type" || activeBrand === brand}
        />
      ))}
    </div>
  );
}

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
    paymentMethod: "Credit/Debit Card",
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    googlePayId: "",
    paypalEmail: "",
    upiId: "",
    bankName: "",
    otherBankName: "",
    bankRoutingCode: "",
    accountHolderName: "",
    transferBankName: "",
    transferReference: "",
    rememberPayment: false
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
  const renewalDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  }, []);
  const renewalCharge = activePlan.custom
    ? "the agreed custom subscription amount"
    : totalRange
      ? `${formatRange(totalRange.min, totalRange.max)}/${billing === "annual" ? "year" : "month"}`
      : "the selected subscription amount";

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => router.push("/dashboard"), 800);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckedChange = (key, checked) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const handleRegionChange = (nextRegion) => {
    const nextMethods = paymentConfigByRegion[nextRegion].methods;
    setRegion(nextRegion);
    setForm((prev) => ({
      ...prev,
      paymentMethod: nextMethods.some((method) => method.name === prev.paymentMethod)
        ? prev.paymentMethod
        : nextMethods[0].name,
      bankName: "",
      otherBankName: "",
      bankRoutingCode: "",
    }));
  };

  const handleCardNumberChange = (value) => {
    handleChange("cardNumber", formatCardNumber(value));
  };

  const handleExpiryChange = (value) => {
    handleChange("expiry", formatExpiry(value));
  };

  const handleCvvChange = (value) => {
    handleChange("cvv", value.replace(/\D/g, "").slice(0, 4));
  };

  const isCardPayment = form.paymentMethod === "Credit/Debit Card";
  const paymentConfig = paymentConfigByRegion[region];
  const detectedCardBrand = getCardBrand(form.cardNumber);
  const cardBrandUnavailable = detectedCardBrand && detectedCardBrand !== "Card type" && !paymentConfig.cardBrands.includes(detectedCardBrand);
  const cardBrand = detectedCardBrand || "";
  const routingLabel = region === "US" ? "Routing Number" : region === "UK" ? "Sort Code" : "IFSC Code";

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
        <p className="text-center text-gray-600 mb-8">Start with a free trial based on your selected plan</p>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-8 flex items-center gap-3">
          <p className="text-slate-700 text-sm ml-2">Choose Region:</p>
          {Object.entries(regionMeta).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleRegionChange(key)}
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

        <div className="mb-10 max-w-5xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Free trial</p>
          <p className="mt-1">
            Free trial access is available for 14 to 30 days depending on the selected plan, region, and account eligibility. Payment details may be required to activate the trial.
          </p>
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

        <form onSubmit={handleSubmit} className="max-w-[900px] mx-auto bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-5">Complete Your Subscription</h3>

          <div className="mb-5">
            <div className="flex items-center gap-3 text-gray-900 text-lg mb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Company Information
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Company Name <span className="text-red-600">*</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Number of Users <span className="text-red-600">*</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  value={form.users}
                  onChange={(e) => handleChange("users", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-3 text-gray-900 text-lg mb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              Contact Information
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Full Name <span className="text-red-600">*</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email Address <span className="text-red-600">*</span></label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Phone Number <span className="text-red-600">*</span></label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-3 text-gray-900 text-lg mb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Payment Information
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select Payment Method <span className="text-red-600">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                value={form.paymentMethod}
                required
                onChange={(e) => handleChange("paymentMethod", e.target.value)}
              >
                {paymentConfig.methods.map((method) => (
                  <option key={method.name} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
            {isCardPayment ? (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Name on Card <span className="text-red-600">*</span></label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                    value={form.cardholderName}
                    autoComplete="cc-name"
                    placeholder="Name printed on card"
                    required
                    onChange={(e) => handleChange("cardholderName", e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Card Number <span className="text-red-600">*</span></label>
                  <div className="relative">
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-60 text-base tracking-wide"
                      value={form.cardNumber}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      required
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                    />
                    <CardLogoStrip brands={paymentConfig.cardBrands} activeBrand={cardBrand} />
                  </div>
                  {cardBrandUnavailable ? (
                    <p className="mt-2 text-sm text-rose-600">
                      {cardBrand} is not available for {regionMeta[region].label}. Use {paymentConfig.cardBrands.join(", ")}.
                    </p>
                  ) : null}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Expiry Date <span className="text-red-600">*</span></label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-base tracking-wide"
                        value={form.expiry}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={7}
                        placeholder="MM / YY"
                        required
                        onChange={(e) => handleExpiryChange(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">CVV <span className="text-red-600">*</span></label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-16 text-base tracking-wide"
                        value={form.cvv}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        maxLength={4}
                        placeholder="CVC"
                        required
                        onChange={(e) => handleCvvChange(e.target.value)}
                      />
                      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-end gap-1 text-gray-500">
                        <CreditCard className="h-7 w-7" />
                        <span className="mb-0.5 text-xs font-bold">123</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {form.paymentMethod === "Google Pay" ? (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <label className="block text-gray-700 mb-2">
                  {region === "IN" ? "Google Pay UPI ID or Mobile Number" : "Google Pay Email or Mobile Number"} <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                  value={form.googlePayId}
                  placeholder={region === "IN" ? "name@okaxis or mobile number" : "email@example.com or mobile number"}
                  required
                  onChange={(e) => handleChange("googlePayId", e.target.value)}
                />
                <p className="mt-2 text-sm text-slate-600">A secure Google Pay authorization request will be opened after you continue.</p>
              </div>
            ) : null}

            {form.paymentMethod === "PayPal" ? (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <label className="block text-gray-700 mb-2">PayPal Email <span className="text-red-600">*</span></label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                  value={form.paypalEmail}
                  placeholder="billing@example.com"
                  required
                  onChange={(e) => handleChange("paypalEmail", e.target.value)}
                />
                <p className="mt-2 text-sm text-slate-600">You will be redirected to PayPal to approve the subscription payment.</p>
              </div>
            ) : null}

            {form.paymentMethod === "UPI" ? (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <label className="block text-gray-700 mb-2">UPI ID <span className="text-red-600">*</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                  value={form.upiId}
                  placeholder="name@bank"
                  required
                  onChange={(e) => handleChange("upiId", e.target.value)}
                />
                <p className="mt-2 text-sm text-slate-600">A collect request will be sent to this UPI ID for approval.</p>
              </div>
            ) : null}

            {form.paymentMethod === "Net Banking" ? (
              <div className="grid md:grid-cols-2 gap-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <div>
                  <label className="block text-gray-700 mb-2">Bank Name <span className="text-red-600">*</span></label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                    value={form.bankName}
                    required
                    onChange={(e) => handleChange("bankName", e.target.value)}
                  >
                    <option value="">Select bank</option>
                    {paymentConfig.banks.map((bank) => (
                      <option key={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Account Holder Name <span className="text-red-600">*</span></label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                    value={form.accountHolderName}
                    placeholder="Registered account holder"
                    required
                    onChange={(e) => handleChange("accountHolderName", e.target.value)}
                  />
                </div>
                {form.bankName === "Other Bank" ? (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2">Other Bank Name <span className="text-red-600">*</span></label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                        value={form.otherBankName}
                        placeholder="Enter bank name"
                        required
                        onChange={(e) => handleChange("otherBankName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">{routingLabel} <span className="text-red-600">*</span></label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                        value={form.bankRoutingCode}
                        placeholder={`Enter ${routingLabel.toLowerCase()}`}
                        required
                        onChange={(e) => handleChange("bankRoutingCode", e.target.value)}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {form.paymentMethod === "Bank Transfer" ? (
              <div className="grid md:grid-cols-2 gap-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <div>
                  <label className="block text-gray-700 mb-2">Transfer Bank Name <span className="text-red-600">*</span></label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                    value={form.transferBankName}
                    placeholder="Bank used for transfer"
                    required
                    onChange={(e) => handleChange("transferBankName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Transaction Reference <span className="text-red-600">*</span></label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                    value={form.transferReference}
                    placeholder="UTR / reference number"
                    required
                    onChange={(e) => handleChange("transferReference", e.target.value)}
                  />
                </div>
                <p className="md:col-span-2 text-sm text-slate-600">Use the reference number from your completed bank transfer so the subscription can be matched quickly.</p>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <input
                id="rememberPayment"
                type="checkbox"
                checked={form.rememberPayment}
                onChange={(e) => handleCheckedChange("rememberPayment", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="rememberPayment" className="text-sm font-medium text-slate-700">
                Remember this card for future use
              </label>
              <div className="group relative">
                <button
                  type="button"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-bold text-slate-600"
                  aria-label="Payment security information"
                >
                  ?
                </button>
                <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs leading-5 text-white shadow-xl group-hover:block">
                  For security, Abhyaka will not store your actual card or payment details. A secure payment token from the payment provider is saved for future billing.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-5">
            <h4 className="text-lg font-semibold tracking-tight text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2.5 text-gray-700 text-sm">
              <div className="flex justify-between">
                <span>Plan {activePlan.name}</span>
                <span>
                  {activePlan.custom || !activePriceRange
                    ? "Custom"
                    : `${formatRange(activePriceRange.min, activePriceRange.max)}/user`}
                </span>
              </div>
              <div className="flex justify-between"><span>Billing Cycle</span><span>{billing === "annual" ? "Annual" : "Monthly"}</span></div>
              <div className="flex justify-between"><span>Region</span><span>{regionMeta[region].label}</span></div>
              <div className="flex justify-between"><span>Number of Users</span><span>{userCount}</span></div>
              {billing === "annual" && (
                <>
                  <div className="flex justify-between text-emerald-600"><span>Discount (Annual)</span><span>-15%</span></div>
                  {monthlyEquivalentRange && (
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly list price</span>
                      <span>{formatRange(monthlyEquivalentRange.min, monthlyEquivalentRange.max)}/user</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-300 flex justify-between text-xl font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {activePlan.custom
                  ? "Contact Sales"
                  : totalRange
                    ? `${formatRange(totalRange.min, totalRange.max)}/${billing === "annual" ? "year" : "month"}`
                    : "Custom"}
              </span>
            </div>
            <div className="mt-4 flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-500 text-xs font-semibold text-slate-700">
                i
              </span>
              <p>
                Your subscription will auto renew on {renewalDate}. You will be charged {renewalCharge} + tax.
              </p>
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
