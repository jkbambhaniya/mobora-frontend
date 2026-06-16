"use client";

import React, { useEffect, useState } from "react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Mobora's vendor dashboard helped us double our monthly trade-ins. The grading and counter-offer pipeline works flawlessly.",
    author: "Rajesh Kumar",
    role: "Owner",
    company: "MoboMax Refurbished",
  },
  {
    quote: "Listing used devices and tracking exchange orders has never been simpler. The custom analytics tell us exactly what models are in demand.",
    author: "Sarah Jenkins",
    role: "Operations Head",
    company: "QuickTrades Mobiles",
  },
  {
    quote: "Integrating our retail exchange desk with Mobora saved our agents hours of manual verification. It's a complete game-changer.",
    author: "Vikram Singh",
    role: "Founder",
    company: "PhoneCycle Traders",
  },
];

export const AuthMarketingSide: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex-1 hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-zinc-100/50 dark:bg-zinc-900/30 text-zinc-900 dark:text-white border-b lg:border-b-0 lg:border-r border-zinc-200/50 dark:border-zinc-800/80 min-h-[600px]">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/25 blur-[100px] animate-[pulse_8s_infinite_alternate]" />
        <div className="absolute top-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] animate-[pulse_10s_infinite_alternate]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-success/15 blur-[90px] animate-[pulse_12s_infinite_alternate]" />
      </div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0f172a04_1px,transparent_1px),linear-gradient(to_bottom,#0f172a04_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-950 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
          Mobora
        </span>
      </div>

      {/* Hero Copy (Middle) */}
      <div className="relative z-10 my-auto max-w-lg space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight leading-tight md:text-5xl bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
          Scale your buyback, retail, and exchange business.
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
          Manage phone inventory, run trade-in evaluations, verify phone conditions, and process customer orders in one real-time dashboard.
        </p>
      </div>

      {/* Testimonial Carousel (Bottom) */}
      <div className="relative z-10 min-h-[140px] border-t border-zinc-200/80 dark:border-zinc-850 pt-8 mt-auto flex flex-col justify-between">
        <div className="relative overflow-hidden h-[90px]">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${
                idx === activeIndex
                  ? "opacity-100 translate-x-0"
                  : idx < activeIndex
                  ? "opacity-0 -translate-x-12 pointer-events-none"
                  : "opacity-0 translate-x-12 pointer-events-none"
              }`}
            >
              <p className="text-zinc-700 dark:text-zinc-300 italic text-base font-light leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-secondary">
                  {testimonial.author}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">&bull;</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {testimonial.role}, {testimonial.company}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex gap-2 mt-4">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
