"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing-header";
import LandingFooter from "@/components/landing-footer";

interface ModelConfig {
  name: string;
  baseVal: number;
}

const DEVICES: Record<string, ModelConfig[]> = {
  Apple: [
    { name: "iPhone 15 Pro Max", baseVal: 1100 },
    { name: "iPhone 15 Pro", baseVal: 999 },
    { name: "iPhone 14 Pro Max", baseVal: 850 },
    { name: "iPhone 14", baseVal: 650 },
    { name: "iPhone 13 Pro", baseVal: 550 },
  ],
  Samsung: [
    { name: "Galaxy S24 Ultra", baseVal: 1150 },
    { name: "Galaxy S24+", baseVal: 899 },
    { name: "Galaxy S23 Ultra", baseVal: 750 },
    { name: "Galaxy Z Fold 5", baseVal: 1200 },
    { name: "Galaxy A54 5G", baseVal: 350 },
  ],
  Google: [
    { name: "Pixel 8 Pro", baseVal: 850 },
    { name: "Pixel 8", baseVal: 650 },
    { name: "Pixel 7 Pro", baseVal: 500 },
    { name: "Pixel 7a", baseVal: 350 },
  ],
  OnePlus: [
    { name: "OnePlus 12", baseVal: 799 },
    { name: "OnePlus 11", baseVal: 550 },
    { name: "OnePlus Nord 3", baseVal: 320 },
  ],
};

const CONDITIONS = [
  { name: "Excellent (Like New)", factor: 1.0 },
  { name: "Good", factor: 0.85 },
  { name: "Fair", factor: 0.65 },
  { name: "Broken / Faulty", factor: 0.35 },
];

const FAQS: Record<string, { question: string; answer: string }[]> = {
  General: [
    {
      question: "What is Mobora Vendor Hub?",
      answer: "Mobora is an all-in-one platform for mobile vendors to list pre-owned devices, evaluate trade-in offers, and process instant customer device exchanges.",
    },
    {
      question: "How do I get started as a vendor?",
      answer: "Simply click on 'Vendor Register' to create your vendor profile, set up your shop profile, and start listing device inventories.",
    },
  ],
  "Devices & Grading": [
    {
      question: "How is device evaluation calculated?",
      answer: "The price calculator evaluates devices dynamically based on their brand, original base value, selected storage tier, and visual/functional condition factors.",
    },
    {
      question: "What conditions are supported?",
      answer: "We support Excellent (Like New), Good, Fair, and Broken/Faulty grading scales to accurately estimate trade-in values.",
    },
  ],
  Security: [
    {
      question: "How are blacklisted IMEIs handled?",
      answer: "Mobora flags lost, stolen, or blocked IMEIs instantly using real-time carrier databases to prevent illegal device transactions.",
    },
  ],
};

const plans = [
  {
    name: "Starter",
    price: "₹2,499/mo",
    popular: false,
    features: [
      "Up to 100 device lookups/mo",
      "Basic IMEI checking",
      "Standard dashboard access",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "₹6,499/mo",
    popular: true,
    features: [
      "Unlimited device lookups",
      "Real-time blacklisted IMEI checks",
      "Advanced sales & trade analytics",
      "Priority 24/7 support",
      "Integration API access",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    popular: false,
    features: [
      "Dedicated account manager",
      "Custom grading pipelines",
      "Multi-store location support",
      "SLA guarantee",
      "Custom reporting & exports",
    ],
  },
];

export default function Home() {
  const [activeStat, setActiveStat] = useState(0);

  // Calculator State
  const [selectedBrand, setSelectedBrand] = useState("Apple");
  const [selectedModelName, setSelectedModelName] = useState(DEVICES.Apple[0].name);
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS[0].name);
  const [calcResult, setCalcResult] = useState<{ low: number; high: number } | null>(null);

  // FAQ State
  const [activeFAQCategory, setActiveFAQCategory] = useState("General");
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  // Realigned Dashboard Stats mapping to actual features
  const statsList = [
    { label: "Active Chat Sessions", value: "18 Live Chats", color: "text-primary" },
    { label: "Blacklisted IMEIs Flagged", value: "1,482 Devices", color: "text-red-500" },
    { label: "Unresolved Demand Requirements", value: "43 Matched", color: "text-amber-500" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % statsList.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
          }
        });
      },
      { threshold: 0.05 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModelName(DEVICES[brand][0].name);
  };

  const handleCalculate = () => {
    const models = DEVICES[selectedBrand];
    const model = models.find((m) => m.name === selectedModelName) || models[0];
    const cond = CONDITIONS.find((c) => c.name === selectedCondition) || CONDITIONS[0];

    let base = model.baseVal;
    if (selectedStorage === "128GB") base -= 50;
    if (selectedStorage === "512GB") base += 100;
    if (selectedStorage === "1TB") base += 250;

    const computed = base * cond.factor * 83;
    setCalcResult({
      low: Math.round(computed * 0.95),
      high: Math.round(computed * 1.05),
    });
  };

  const features = [
    {
      title: "Real-Time Live Chat",
      description: "Chat instantly with your customers or other store clerks. Handle device negotiations, share specifications, and lock transactions directly inside the chat workspace.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025 4.479 4.479 0 00-.685-2.89A8.978 8.978 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      color: "from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "IMEI Blacklist Protection",
      description: "Keep your business secure. Register and audit blacklisted IMEIs or serial numbers to immediately flag and block lost, stolen, or lock-status devices during appraisals.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
        </svg>
      ),
      color: "from-red-500/10 to-orange-500/10 text-red-600 dark:text-red-400",
    },
    {
      title: "Demand & Requirements Matching",
      description: "Log specific requirements when customers want a particular model or specification. The system automatically alerts you when matching inventory is checked in.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408l-3.285-3.285m0 0a.75.75 0 010-1.06l3.285-3.285m-3.285 3.285h14.25" />
        </svg>
      ),
      color: "from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Courier & Shipping Orders",
      description: "Process device shipping requests seamlessly. Link transactions directly to courier details, track delivery status, and generate mailing documents directly from your admin panel.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.61 3.84a14.98 14.98 0 00-6.16 12.12c0 2.26.502 4.414 1.4 6.34L9.61 17.58c.28-.28.66-.44 1.06-.44h4.92z" />
        </svg>
      ),
      color: "from-cyan-500/10 to-teal-500/10 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Master Specifications Control",
      description: "Separate design templates from active inventory counts. Create master specifications for brands, models, storage sizes (RAM/ROM), and color configurations.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      title: "Store & Catalog Sync",
      description: "Manage multi-store setups, track individual cashier logins, monitor pending trades, and sync mobile device inventory levels automatically.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M7.5 12l-3 3m3-3l3 3" />
        </svg>
      ),
      color: "from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Set Master Specifications",
      description: "Onboard your store and configure brands, models, colors, and memory sizes inside the system parameters catalog.",
    },
    {
      number: "02",
      title: "Verify IMEI Blacklists",
      description: "Log trade requests, verify device serials, and scan blacklisted IMEIs to avoid security threats.",
    },
    {
      number: "03",
      title: "Negotiate via Live Chat",
      description: "Negotiate purchase rates and settle trade values directly using our built-in instant messaging desks.",
    },
    {
      number: "04",
      title: "Ship with Courier Partners",
      description: "Record device settlements, generate shipment requirements, and coordinate package courier labels.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 relative overflow-hidden min-h-screen">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full bg-secondary/10 dark:bg-secondary/5 blur-[120px] pointer-events-none" />

      <LandingHeader />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10 space-y-24">
        {/* Intro */}
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary dark:text-secondary text-xs font-bold uppercase tracking-wider animate-fadeIn">
            ✨ Advanced Campaign & Trading Platform
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Advanced Live Chat, IMEI Blacklist &{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Courier Operations
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The standard enterprise operations engine for smart device trading networks. Handle live chat negotiation channels, secure blacklist IMEI lookups, automate customer purchase requirements, and dispatch courier packaging.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="gradient" size="lg" shape="pill" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" shape="pill" className="w-full sm:w-auto">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </section>

        {/* Live Dashboard Simulator Frame */}
        <section className="reveal w-full max-w-5xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 text-left relative">
          <div className="absolute -top-3 left-6 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
            Live Preview
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Mobora Campaign Dashboard</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Audit daily chat deals, device blacklists, and packaging shipments</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Secure Audit Feed Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statsList.map((stat, idx) => (
              <div
                key={stat.label}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  activeStat === idx
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md scale-[1.02]"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40"
                }`}
              >
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={`text-xl font-bold mt-1.5 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs space-y-2">
              <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Simulated Live IMEI Blacklist Verification
              </h4>
              <div className="flex justify-between border-b border-zinc-200/40 dark:border-zinc-850 pb-1.5">
                <span className="text-zinc-500">IMEI: 358742091845112</span>
                <span className="font-semibold text-success">CLEARED (No Records)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">IMEI: 354110829104882</span>
                <span className="font-semibold text-red-500">BLACKLISTED (Stolen Flag)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Active Requirements Matching
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Customer wants: iPhone 14 Pro Max 256GB Gold. Status: Traded stock matched! Alert sent via Chat.
                </p>
              </div>
              <div className="pt-2 text-right">
                <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                  View Matching Logs &rarr;
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="reveal space-y-12 scroll-mt-20">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Centralized Modules for Enterprise Scale
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Check how Mobora consolidates chat negotiations, IMEI blacklist protection, and packaging shipments.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 shadow-md hover:shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="reveal space-y-12 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              The Workflow Sequence
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Operate your store, negotiate, verify blacklist parameters, and dispatch orders from a single portal.
            </p>
          </div>
          <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 md:ml-12 space-y-12 pb-8">
            {steps.map((step) => (
              <div key={step.number} className="relative pl-8 md:pl-16 group">
                <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border-2 border-primary shadow-md">
                  <span className="text-xs font-bold text-primary">{step.number}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Valuation Calculator Section */}
        <section id="calculator" className="reveal space-y-12 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Trade-In Valuation Estimator
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Estimate pre-owned device trade-in valuations instantly using standard wholesale catalog pricing parameters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
            {/* Inputs Panel */}
            <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md space-y-6 shadow-xl text-left">
              {/* Brand Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Select Brand
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(DEVICES).map((brand) => (
                    <button
                      key={brand}
                      onClick={() => handleBrandChange(brand)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        selectedBrand === brand
                          ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-950"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-850"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Select Model
                </label>
                <select
                  value={selectedModelName}
                  onChange={(e) => setSelectedModelName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white"
                >
                  {DEVICES[selectedBrand].map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Storage Option
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["128GB", "256GB", "512GB", "1TB"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStorage(st)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        selectedStorage === st
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Device Condition
                </label>
                <div className="space-y-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.name}
                      onClick={() => setSelectedCondition(cond.name)}
                      className={`w-full text-left p-3 rounded-lg text-xs border transition-all ${
                        selectedCondition === cond.name
                          ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary font-bold"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div>{cond.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="gradient" size="lg" className="w-full pt-3" onClick={handleCalculate}>
                Calculate Estimate
              </Button>
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {calcResult ? (
                <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-xl text-center space-y-6 animate-scaleUp">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success px-3 py-1 rounded-full">
                    Calculation Successful
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      Estimated Valuation
                    </h3>
                    <div className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
                      ₹{calcResult.low.toLocaleString('en-IN')} - ₹{calcResult.high.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4 text-left text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Device:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">{selectedModelName} ({selectedStorage})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cosmetic Rating:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">{selectedCondition.split(" ")[0]}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Estimator Ready</h3>
                  <p className="text-xs max-w-xs mt-1">
                    Select options and click "Calculate Estimate" to generate pricing ranges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="reveal space-y-12 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Flexible Plans For Every Business Size
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Choose a plan that matches your current smartphone sales volume.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.popular
                    ? "border-primary bg-white dark:bg-zinc-900 shadow-2xl scale-[1.03]"
                    : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md"
                }`}
              >
                <div className="space-y-4 text-left">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                  <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{plan.price}</div>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6">
                  <Link href="/register" className="w-full">
                    <Button variant={plan.popular ? "gradient" : "outline"} className="w-full" shape="pill">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="reveal space-y-12 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Need answers about setup, billing, or device catalogs?
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start max-w-4xl mx-auto">
            {/* Sidebar */}
            <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {Object.keys(FAQS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveFAQCategory(cat);
                    setOpenFAQIndex(0);
                  }}
                  className={`px-4 py-2 rounded-lg text-left text-xs font-bold whitespace-nowrap transition-all ${
                    activeFAQCategory === cat
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Questions list */}
            <div className="flex-1 w-full space-y-4 text-left">
              {FAQS[activeFAQCategory].map((faq, idx) => {
                const isOpen = openFAQIndex === idx;
                return (
                  <div
                    key={faq.question}
                    className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFAQIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-zinc-900 dark:text-white"
                    >
                      <span>{faq.question}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-850 leading-relaxed animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
