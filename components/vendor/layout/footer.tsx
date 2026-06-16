"use client";

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 pt-8 pb-6 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-6 px-2">
      {/* Brand & Copyright Info */}
      <div className="flex flex-col items-center md:items-start gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-[9px]">
            M
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Mobora Portal</span>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          &copy; {currentYear} Mobora Portal. All rights reserved. Campaign Operations Platform.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center gap-6 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <a href="#help" className="hover:text-primary dark:hover:text-secondary transition-colors">Help Center</a>
        <a href="#api" className="hover:text-primary dark:hover:text-secondary transition-colors">API Docs</a>
        <a href="#terms" className="hover:text-primary dark:hover:text-secondary transition-colors">Terms of Service</a>
        <a href="#privacy" className="hover:text-primary dark:hover:text-secondary transition-colors">Privacy Policy</a>
      </div>

      {/* Operations Info */}
      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems Operational
        </span>
        <span className="font-mono text-zinc-300 dark:text-zinc-800">v1.2.0</span>
      </div>
    </footer>
  );
}
