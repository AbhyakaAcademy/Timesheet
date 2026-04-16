"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clearSession } from "@/lib/auth";
import {
  Clock,
  Timer,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  PlayCircle,
  HelpCircle,
  Calendar,
  UserRoundPlus,
  Globe,
  Star,
  Send,
  Twitter,
  Linkedin,
  Facebook,
  Mail
} from "lucide-react";

const regionMeta = {
  IN: { label: "India", displayCode: "IN", currency: "INR", symbol: "\u20B9", multiplier: 1, locale: "en-IN" },
  US: { label: "United States", displayCode: "US", currency: "USD", symbol: "$", multiplier: 0.012, locale: "en-US" },
  UK: { label: "United Kingdom", displayCode: "GB", currency: "GBP", symbol: "\u00A3", multiplier: 0.0095, locale: "en-GB" }
};

const basePlans = [
  {
    name: "Starter",
    priceMin: 149,
    priceMax: 249,
    description: "Perfect for small teams",
    features: ["Up to 25 users", "Basic time tracking", "Standard reports", "Email support", "Mobile apps"]
  },
  {
    name: "Professional",
    priceMin: 349,
    priceMax: 599,
    description: "For growing organizations",
    features: ["Up to 100 users", "Advanced analytics", "Custom workflows", "Priority support", "API access", "Single Sign-On"]
  },
  {
    name: "Enterprise",
    custom: true,
    description: "For large enterprises",
    features: ["Unlimited users", "White-label options", "Dedicated support", "Custom integrations", "SLA guarantee", "Advanced security"]
  }
];

const trustedCompanies = [
  { name: "Global Solutions Inc", colors: "from-sky-500 to-blue-600" },
  { name: "Innovation Labs", colors: "from-emerald-500 to-teal-600" },
  { name: "Digital Dynamics", colors: "from-orange-500 to-rose-600" },
  { name: "FutureStack", colors: "from-indigo-500 to-violet-600" },
  { name: "TechCorp Industries", colors: "from-cyan-500 to-blue-500" },
  { name: "Nova Operations", colors: "from-fuchsia-500 to-pink-600" }
];

const demoSlots = ["09:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showScheduleDemo, setShowScheduleDemo] = useState(false);
  const [region, setRegion] = useState("IN");
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [feedbackForm, setFeedbackForm] = useState({ name: "", email: "", rating: 0, feedback: "" });
  const [feedbackList, setFeedbackList] = useState([
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp Industries",
      rating: 4.6,
      feedback: "Abhyaka has completely transformed how we manage time tracking and approval workflows."
    },
    {
      name: "Michael Chen",
      role: "Operations Manager",
      company: "Global Solutions Inc",
      rating: 4.5,
      feedback: "Best timesheet platform we have ever used. Reporting and analytics are exceptional."
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "Innovation Labs",
      rating: 4.6,
      feedback: "Integration capabilities are fantastic and ROI was visible within the first month."
    },
    {
      name: "Aarav Mehta",
      role: "Finance Lead",
      company: "FutureStack",
      rating: 4.5,
      feedback: "Approvals are faster and our teams now submit accurate timesheets without reminders."
    },
    {
      name: "Olivia Turner",
      role: "People Ops Manager",
      company: "Nova Operations",
      rating: 4.6,
      feedback: "The onboarding was smooth, and dashboard visibility for department heads is excellent."
    }
  ]);

  const [scheduleDemoForm, setScheduleDemoForm] = useState({
    name: "",
    email: "",
    date: todayIso,
    time: demoSlots[0],
    questions: ""
  });

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScheduleDemoSubmit = (e) => {
    e.preventDefault();
    if (!scheduleDemoForm.name || !scheduleDemoForm.email || !scheduleDemoForm.date || !scheduleDemoForm.time) {
      alert("Please complete all required demo fields.");
      return;
    }
    alert("Demo scheduled successfully!");
    setShowScheduleDemo(false);
  };

  const handleScheduleQuestionsChange = (value) => {
    const words = value.trim() ? value.trim().split(/\s+/) : [];
    if (words.length <= 250) {
      setScheduleDemoForm({ ...scheduleDemoForm, questions: value });
    }
  };

  const scheduleWordCount = scheduleDemoForm.questions.trim()
    ? scheduleDemoForm.questions.trim().split(/\s+/).length
    : 0;
  const selectedDateLabel = scheduleDemoForm.date
    ? new Date(`${scheduleDemoForm.date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    : "";

  const handleHelpSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! We will contact you soon.");
    setShowHelp(false);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackForm.name || !feedbackForm.email || feedbackForm.rating < 1) return;
    setFeedbackList((prev) => [
      {
        name: feedbackForm.name,
        role: "Customer",
        company: "Verified User",
        rating: feedbackForm.rating,
        feedback: feedbackForm.feedback || "Great experience with Abhyaka."
      },
      ...prev
    ]);
    setFeedbackForm({ name: "", email: "", rating: 0, feedback: "" });
  };

  const openInfo = (label) => {
    window.alert(`${label} page will be available soon.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fb] via-[#eef4fb] to-[#ececf8] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <header className="relative z-20 px-6 py-5 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] leading-[0.95] tracking-[-0.03em] font-semibold text-slate-900">Abhyaka</h1>
              <p className="text-[14px] leading-[1.05] tracking-[-0.01em] text-slate-600">Time Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex gap-8">
            {["features", "pricing", "about"].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-[16px] leading-none text-slate-700 hover:text-slate-900 transition-colors"
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHelp(true)}
              className="px-3 py-2 rounded-xl flex items-center gap-2 text-[16px] text-slate-700 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Help
            </button>
            <Link
              href="/login"
              onClick={() => clearSession()}
              className="px-3 py-2 rounded-xl text-[16px] text-slate-700 hover:text-slate-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[17px] leading-none rounded-xl shadow-lg"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-6 pt-16 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.08)] text-[13px] leading-none text-indigo-600 mb-6">
              <Zap className="w-3.5 h-3.5" strokeWidth={2.1} />
              Enterprise Time Management
            </div>

            <h1 className="text-[46px] md:text-[54px] leading-[1.08] tracking-[-0.03em] font-medium text-[#0f1d38] mb-6">
              Transform Time Into
              <br />
              <span className="bg-gradient-to-r from-[#4a47f0] to-[#7e1ee7] bg-clip-text text-transparent">Team Success</span>{" "}
              with
              <br />
              <span className="font-semibold">Abhyaka</span>
            </h1>

            <p className="text-[18px] leading-[1.6] text-slate-600 max-w-[700px] mb-8">
              Revolutionary timesheet platform that transforms how enterprises track time, manage teams, and drive productivity. Join 10,000+ companies already saving 20+ hours per week.
            </p>

            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/subscription"
                className="bg-gradient-to-r from-[#4648ee] to-[#8a11e8] text-white px-10 py-5 rounded-[12px] shadow-[0_20px_40px_rgba(88,40,201,0.28)] text-[18px] leading-none font-semibold inline-flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setShowDemo(true)}
                className="bg-white px-10 py-5 rounded-[12px] shadow-[0_14px_34px_rgba(15,23,42,0.12)] inline-flex items-center gap-2 text-[#243b64] text-[18px] leading-none font-medium"
              >
                <PlayCircle className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
                Watch Demo
              </button>
            </div>

            <div className="mt-4 lg:mt-32 flex flex-wrap items-center gap-x-9 gap-y-3 text-[13px] text-slate-600">
              <div className="inline-flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free 30-day free trial
              </div>
              <div className="inline-flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="inline-flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Enterprise-ready security
              </div>
            </div>
          </div>

          <div className="relative h-[590px]">
            <div className="absolute top-0 right-0 w-[560px] bg-white/92 rounded-[22px] border border-slate-200/80 shadow-[0_28px_50px_rgba(15,23,42,0.11)] p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[20px] leading-none text-slate-600 mb-2">Today&apos;s Activity</p>
                  <h2 className="text-[42px] leading-none font-medium text-[#0e1f44]">8h 24m</h2>
                </div>
                <div className="w-[70px] h-[70px] bg-gradient-to-br from-[#11ca93] to-[#09b6aa] rounded-[16px] flex items-center justify-center text-white">
                  <Timer className="w-9 h-9" strokeWidth={1.8} />
                </div>
              </div>
              <div className="h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div className="h-full w-[78%] bg-gradient-to-r from-[#12c084] to-[#14b8a6]" />
              </div>
              <p className="text-[16px] text-slate-600 mt-3">78% of daily goal completed</p>
            </div>

            <div className="absolute top-[145px] right-0 w-[300px] bg-white/95 rounded-[20px] border border-slate-200/80 shadow-[0_20px_38px_rgba(15,23,42,0.11)] px-5 py-5">
              <div className="flex gap-4 mb-3">
                <div className="w-[50px] h-[50px] rounded-[12px] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                  <UserRoundPlus className="w-6 h-6 text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[15px] leading-none text-slate-600 mb-1.5">Team Members</p>
                  <h3 className="text-[38px] leading-none font-medium text-[#0e1f44]">247</h3>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  {[0, 1, 2, 3].map((id) => (
                    <div
                      key={id}
                      className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-[#5b7fe8] to-[#4f65ea]"
                    />
                  ))}
                </div>
                <p className="text-[14px] text-[#3a5b88]">Active now</p>
              </div>
            </div>

            <div className="absolute top-[380px] left-0 w-[340px] bg-white/95 rounded-[20px] border border-slate-200/80 shadow-[0_20px_38px_rgba(15,23,42,0.11)] px-6 py-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[14px] leading-none text-slate-600 mb-2">This Week</p>
                  <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.01em] text-[#0e1f44]">+24% Productivity</h3>
                </div>
                <div className="w-[50px] h-[50px] rounded-[12px] bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" strokeWidth={1.8} />
                </div>
              </div>
              <div className="h-[88px] flex items-end gap-2.5">
                {[32, 57, 37, 72, 64, 49, 76].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-lg bg-gradient-to-b from-[#5f9df3] to-[#13add7]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Teams</h2>
            <p className="text-xl text-gray-600">Everything you need to manage time effectively across your organization</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: "Smart Time Tracking", description: "Automated time capture with intelligent categorization and project association", gradient: "from-indigo-600 to-purple-600" },
              { icon: Users, title: "Team Management", description: "Multi-level user roles, departments, and hierarchical reporting structures", gradient: "from-orange-500 to-rose-600" },
              { icon: BarChart3, title: "Advanced Analytics", description: "Real-time dashboards and custom reports for data-driven decisions", gradient: "from-cyan-500 to-blue-600" },
              { icon: Shield, title: "Enterprise Security", description: "SOC 2 Type II certified with role-based access control and audit logs", gradient: "from-emerald-500 to-teal-600" },
              { icon: CheckCircle2, title: "Approval Workflows", description: "Customizable multi-level approval processes for timesheets and time-off", gradient: "from-violet-500 to-purple-600" },
              { icon: Zap, title: "Integrations", description: "Seamlessly connect with your existing tools and workflows", gradient: "from-amber-500 to-orange-600" }
            ].map((feature, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 px-6 py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your organization</p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-3 mb-10 flex items-center gap-3">
            <Globe className="w-6 h-6 text-slate-500 ml-3" />
            <p className="text-slate-700">Select Region:</p>
            {Object.entries(regionMeta).map(([key, r]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRegion(key)}
                className={`px-5 py-2 rounded-xl text-lg ${region === key ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                <span className="text-xs mr-2 align-middle">{r.displayCode}</span>
                {r.label}
              </button>
            ))}
            <span className="ml-auto mr-3 text-slate-500">({regionMeta[region].currency})</span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {basePlans.map((plan, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent transition-all duration-200 hover:border-indigo-600 hover:shadow-2xl hover:-translate-y-1"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-8">
                  {plan.custom ? (
                    <p className="text-3xl font-bold text-gray-900">Contact us</p>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {regionMeta[region].symbol}
                      {Math.round(plan.priceMin * regionMeta[region].multiplier).toLocaleString(regionMeta[region].locale)}-
                      {Math.round(plan.priceMax * regionMeta[region].multiplier).toLocaleString(regionMeta[region].locale)}
                      <span className="text-lg text-gray-500">/user/month</span>
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/subscription">
                  <button className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-900 transition-all hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-xl">
                    Get Started
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 text-white text-center shadow-2xl">
            <Calendar className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">See Abhyaka in Action</h2>
            <p className="text-xl mb-8 opacity-90">Schedule a personalized demo with our team and discover how Abhyaka can transform your time management</p>

            <button onClick={() => setShowScheduleDemo(true)} className="px-6 py-3 bg-white text-indigo-600 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Schedule Your Demo
            </button>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6"><h4 className="text-lg font-bold mb-2">30 Minutes</h4><p className="text-sm opacity-80">Personalized walkthrough</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6"><h4 className="text-lg font-bold mb-2">Live Q&A</h4><p className="text-sm opacity-80">Get all your questions answered</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6"><h4 className="text-lg font-bold mb-2">No Commitment</h4><p className="text-sm opacity-80">Just explore the platform</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 px-6 py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Abhyaka</h2>
            <p className="text-xl text-gray-600">Transforming enterprise time management since 2025</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 rounded-2xl p-8 border-2 border-emerald-200">
              <h3 className="text-2xl font-bold text-emerald-700 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">At Abhyaka, we believe that time is the most valuable asset for any organization. Our mission is to empower enterprises with intelligent time management solutions that drive productivity, enhance collaboration, and provide actionable insights.</p>
            </div>

            <div className="bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 rounded-2xl p-8 border-2 border-violet-200">
              <h3 className="text-2xl font-bold text-violet-700 mb-4">Our Story</h3>
              <p className="text-gray-700 leading-relaxed">Founded in 2025 by a team of enterprise software veterans, Abhyaka was born from the frustration of using outdated timesheet systems. We set out to build a modern, intuitive platform that employees actually enjoy using.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Leading Organizations</h2>
            <p className="text-2xl text-gray-600">Join thousands of companies transforming their time management</p>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-4">
            <div className="marquee-track flex gap-12 min-w-max pr-5">
              {[...trustedCompanies, ...trustedCompanies].map((company, idx) => (
                <div key={`${company.name}-${idx}`} className="min-w-[360px] bg-slate-100 rounded-2xl border border-slate-200 px-8 py-6 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${company.colors} text-white flex items-center justify-center font-bold`}>
                    {company.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </div>
                  <p className="text-2xl text-gray-800 font-semibold">{company.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Teams Worldwide</h2>
            <p className="text-2xl text-gray-600">See what our customers have to say about Abhyaka</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {feedbackList.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-6 h-6 ${
                        s <= Math.floor(item.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : s - 0.5 <= item.rating
                            ? "text-yellow-400 fill-yellow-400 opacity-70"
                            : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-amber-600 mb-2">{item.rating.toFixed(1)} / 5</p>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">&ldquo;{item.feedback}&rdquo;</p>
                <p className="text-3xl font-semibold text-gray-900">{item.name}</p>
                <p className="text-lg text-gray-600">{item.role}</p>
                <p className="text-lg text-gray-500">{item.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Share Your Experience</h3>
            <p className="text-2xl text-gray-600">We&apos;d love to hear your feedback about Abhyaka</p>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-8">
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xl font-semibold text-gray-800 mb-2">Your Name</label>
                  <input className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xl" placeholder="John Doe" value={feedbackForm.name} onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xl font-semibold text-gray-800 mb-2">Your Email</label>
                  <input className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xl" placeholder="john@company.com" value={feedbackForm.email} onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-2">Rate Your Experience</label>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button type="button" key={s} onClick={() => setFeedbackForm({ ...feedbackForm, rating: s })}>
                      <Star className={`w-12 h-12 ${s <= feedbackForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-2">Your Feedback (Optional)</label>
                <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2 text-xl min-h-[180px]" placeholder="Tell us about your experience with Abhyaka. What features do you love? What could we improve?" value={feedbackForm.feedback} onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })} />
                <p className="text-gray-500 mt-2">{feedbackForm.feedback.length} characters</p>
              </div>

              <div className="text-center mt-6">
                <button className="px-8 py-4 rounded-2xl text-3xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 inline-flex items-center gap-2">
                  <Send className="w-7 h-7" />
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className="px-6 py-16 bg-[#071a3c] text-slate-300 border-t border-slate-700/40">
        <div className="max-w-[1520px] mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-4xl font-semibold text-white leading-none">Abhyaka</p>
                  <p className="text-slate-400">Time Intelligence</p>
                </div>
              </div>
              <p className="text-slate-300">Enterprise-grade timesheet and workforce management platform trusted by 10,000+ organizations worldwide.</p>
              <div className="flex items-center gap-3 mt-6">
                {[Twitter, Linkedin, Facebook, Mail].map((Icon, idx) => (
                  <span key={idx} className="w-11 h-11 rounded-xl bg-slate-800/70 border border-slate-700 inline-flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-200" />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-white mb-4">Product</p>
              <ul className="space-y-3 text-slate-300">
                <li><button onClick={() => scrollToSection("features")}>Features</button></li>
                <li><button onClick={() => scrollToSection("pricing")}>Pricing</button></li>
                <li><button onClick={() => openInfo("Integrations")}>Integrations</button></li>
                <li><button onClick={() => openInfo("Security")}>Security</button></li>
                <li><button onClick={() => openInfo("Mobile Apps")}>Mobile Apps</button></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-4">Company</p>
              <ul className="space-y-3 text-slate-300">
                <li><button onClick={() => scrollToSection("about")}>About</button></li>
                <li><button onClick={() => openInfo("Careers")}>Careers</button></li>
                <li><button onClick={() => openInfo("Blog")}>Blog</button></li>
                <li><button onClick={() => openInfo("Press Kit")}>Press Kit</button></li>
                <li><button onClick={() => openInfo("Partners")}>Partners</button></li>
                <li><button onClick={() => openInfo("Contact Sales")}>Contact Sales</button></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-4">Resources</p>
              <ul className="space-y-3 text-slate-300">
                <li><button onClick={() => openInfo("Documentation")}>Documentation</button></li>
                <li><button onClick={() => openInfo("API Reference")}>API Reference</button></li>
                <li className="pt-1 font-semibold text-slate-200">Support Center</li>
                <li><button onClick={() => openInfo("Community Forum")}>Community Forum</button></li>
                <li><button onClick={() => openInfo("Status Page")}>Status Page</button></li>
                <li><button onClick={() => openInfo("Terms of Service")}>Terms of Service</button></li>
                <li><button onClick={() => openInfo("Privacy Policy")}>Privacy Policy</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-slate-300">
            <p>&copy; 2026 Abhyaka. All rights reserved.</p>
            <div className="flex items-center gap-6 text-slate-400">
              <button onClick={() => openInfo("Cookie Settings")}>Cookie Settings</button>
              <button onClick={() => openInfo("Legal")}>Legal</button>
              <button onClick={() => openInfo("Sitemap")}>Sitemap</button>
            </div>
          </div>
        </div>
      </footer>

      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 relative">
            <button onClick={() => setShowDemo(false)} className="absolute top-4 right-4 text-2xl text-gray-500">&times;</button>
            <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">Watch Abhyaka in Action</h3>
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-20 h-20 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-2xl text-gray-500">&times;</button>
            <h3 className="text-2xl font-bold mb-6 text-center">Need Help?</h3>
            <form onSubmit={handleHelpSubmit} className="space-y-4">
              <input className="w-full border px-4 py-2 rounded" placeholder="Name" />
              <input className="w-full border px-4 py-2 rounded" placeholder="Email" />
              <textarea className="w-full border px-4 py-2 rounded" placeholder="Message" />
              <button className="w-full bg-indigo-600 text-white py-3 rounded">Send Message</button>
            </form>
          </div>
        </div>
      )}

      {showScheduleDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowScheduleDemo(false)} className="absolute top-4 right-4 text-2xl text-gray-500">&times;</button>
            <h3 className="text-2xl font-bold mb-6 text-center">Schedule a Demo</h3>
            <form onSubmit={handleScheduleDemoSubmit} className="space-y-4">
              <input className="w-full border px-4 py-2 rounded" placeholder="Name" value={scheduleDemoForm.name} onChange={(e) => setScheduleDemoForm({ ...scheduleDemoForm, name: e.target.value })} />
              <input className="w-full border px-4 py-2 rounded" placeholder="Email" value={scheduleDemoForm.email} onChange={(e) => setScheduleDemoForm({ ...scheduleDemoForm, email: e.target.value })} />
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Date</label>
                <input
                  type="date"
                  min={todayIso}
                  className="w-full border px-4 py-2 rounded"
                  value={scheduleDemoForm.date}
                  onChange={(e) => setScheduleDemoForm({ ...scheduleDemoForm, date: e.target.value })}
                />
                {selectedDateLabel && <p className="text-xs text-slate-500 mt-1">Selected: {selectedDateLabel}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Slot</label>
                <select
                  className="w-full border px-4 py-2 rounded"
                  value={scheduleDemoForm.time}
                  onChange={(e) => setScheduleDemoForm({ ...scheduleDemoForm, time: e.target.value })}
                >
                  {demoSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Questions (max 250 words)</label>
                <textarea
                  className="w-full border px-4 py-2 rounded"
                  placeholder="Questions"
                  value={scheduleDemoForm.questions}
                  onChange={(e) => handleScheduleQuestionsChange(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">{scheduleWordCount}/250 words</p>
              </div>
              <button className="w-full bg-indigo-600 text-white py-3 rounded">Schedule Demo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
