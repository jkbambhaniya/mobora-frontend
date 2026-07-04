"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LandingFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="relative z-10 w-full border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-white"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              Mobora
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The next generation Buy, Sell, and Exchange automation engine for pre-owned smartphone vendors. Optimize your grading and trade-ins.
          </p>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Product
          </h4>
          <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <li>
              <a href="/#features" className="hover:text-primary transition-colors">
                Core Features
              </a>
            </li>
            <li>
              <a href="/#calculator" className="hover:text-primary transition-colors">
                Valuation Engine
              </a>
            </li>
            <li>
              <a href="/#pricing" className="hover:text-primary transition-colors">
                Plans & Pricing
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
            Resources
          </h4>
          <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <li>
              <a href="/#how-it-works" className="hover:text-primary transition-colors">
                How It Works
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-primary transition-colors">
                FAQs & Support
              </a>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Newsletter
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Subscribe for product updates, trading insights, and local market reports.
          </p>
          {subscribed ? (
            <p className="text-xs text-success font-semibold">
              Thank you for subscribing! ✨
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white"
              />
              <Button type="submit" variant="gradient" size="sm" shape="rounded">
                Join
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
        <div>
          &copy; {new Date().getFullYear()} Mobora Vendor Hub. All rights reserved. Created with Antigravity.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">Twitter</a>
          <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          <a href="#" className="hover:text-primary transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
