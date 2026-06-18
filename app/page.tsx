"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-secondary/10 dark:bg-secondary/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4.5 h-4.5 text-white"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Mobora
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="gradient" size="sm" shape="pill">
              Vendor Register
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 md:py-24 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5 text-primary dark:text-secondary text-xs font-semibold uppercase tracking-wider animate-fadeIn">
          ✨ Premium Vendor Dashboard
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-55 leading-tight">
          Manage Your Old Mobile Buy, Sell &{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Exchange Business
          </span>
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
          List pre-owned devices, evaluate customer trade-in offers, process instant phone exchanges, and track sales revenue—all in one high-performance dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md pt-4">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="gradient" size="lg" shape="pill" className="w-full sm:w-auto">
              Create Vendor Account
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" shape="pill" className="w-full sm:w-auto">
              Sign In to Portal
            </Button>
          </Link>
        </div>

        {/* Feature Grid preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md space-y-3 shadow-lg shadow-zinc-100/50 dark:shadow-none hover:border-primary/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-55">Smart Device Control</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              List and manage second-hand phones quickly. Specify brand, storage capacities, colors, condition levels, and prices with dynamic status tracking.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md space-y-3 shadow-lg shadow-zinc-100/50 dark:shadow-none hover:border-secondary/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 dark:bg-secondary/20 text-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Exchange & Evaluation Desk</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Review and value old customer devices. Instantly accept, counter-offer, or decline exchange requests with grading pipelines.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md space-y-3 shadow-lg shadow-zinc-100/50 dark:shadow-none hover:border-success/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-success/10 dark:bg-success/20 text-success flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Sales & Trade Insights</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Track business health, analyze top phone brands traded, visualize revenue metrics, and inspect order fulfilment history.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-200/60 dark:border-zinc-800/60 py-6 mt-12 bg-white/10 dark:bg-zinc-950/10 backdrop-blur-md text-center text-xs text-zinc-400 dark:text-zinc-500">
        &copy; {new Date().getFullYear()} Mobora Vendor Hub. All rights reserved. Created with Antigravity.
      </footer>
    </div>
  );
}
