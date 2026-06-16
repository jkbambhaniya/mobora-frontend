"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useDashboard, slugify } from "@/context/dashboard-context";
import { logoutAction } from "@/actions/auth";
import { confirmLogout } from "@/utils/confirm";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function Header() {
  const { setActiveTab, models, vendor } = useDashboard();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef, () => setShowProfileMenu(false), showProfileMenu);

  const getSubTitle = () => {
    if (pathname === "/mobiles") {
      return "Mobiles Directory";
    }
    if (pathname.startsWith("/mobiles/")) {
      const segments = pathname.split("/");
      if (segments.length === 5) {
        return "IMEI Lifecycle Audit";
      } else if (segments.length === 4) {
        return "Model Configurations";
      }
    }
    switch (pathname) {
      case "/dashboard":
        return "System Analytics";
      case "/inventory":
        return "Inventory Catalog";
      case "/specifications":
        return "Dynamic Config Desk";
      case "/billing":
        return "GST & Margin Scheme Invoicing";

      case "/exchanges":
        return "Exchanges Valuation Desk";
      case "/orders":
        return "Fulfillment Ledger";
      case "/profile":
        return "Profile & Preferences";
      case "/customer":
        return "Customer Directory";
      case "/chat":
        return "Live Support & Messaging";
      default:
        return "Overview";
    }
  };

  const getTitle = () => {
    if (pathname === "/mobiles") {
      return "Mobiles Desk";
    }
    if (pathname.startsWith("/mobiles/")) {
      const segments = pathname.split("/");
      const brand = decodeURIComponent(segments[2]);
      const modelParam = decodeURIComponent(segments[3]);
      const modelObj = models?.find(
        (m) => m.brand.toLowerCase() === brand.toLowerCase() && slugify(m.name) === modelParam
      );
      const modelName = modelObj ? modelObj.name : modelParam;

      if (segments.length === 5) {
        return `Device History: ${decodeURIComponent(segments[4])}`;
      } else if (segments.length === 4) {
        return `${brand} ${modelName}`;
      }
    }
    switch (pathname) {
      case "/dashboard":
        return "Performance Portal";
      case "/inventory":
        return "Inventory";
      case "/specifications":
        return "Specifications Desk";
      case "/billing":
        return "Smart Billing Desk";

      case "/exchanges":
        return "Trade-In Review";
      case "/orders":
        return "Orders Ledger";
      case "/profile":
        return "Profile Settings";
      case "/customer":
        return "Customers Desk";
      case "/chat":
        return "Messages Desk";
      default:
        return "Dashboard";
    }
  };

  const handleLogout = () => {
    confirmLogout(async () => {
      try {
        await logoutAction();
      } catch (err) {
        console.error("Logout failed:", err);
      }
      window.location.href = "/";
    });
  };

  return (
    <header className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center md:justify-between pb-4 pt-2 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-2 gap-4">
      {/* Page Title & Context */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80 dark:text-secondary/80">
              {getSubTitle()}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-0.5 text-zinc-900 dark:text-zinc-50 bg-clip-text">
            {getTitle()}
          </h2>
        </div>
        {/* Mobile brand badge */}
        <div className="flex lg:hidden items-center gap-2 bg-gradient-to-tr from-primary/5 to-secondary/5 border border-primary/10 px-2.5 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold tracking-tight text-zinc-700 dark:text-zinc-300">Mobora Portal</span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 ml-auto md:ml-0">
        {/* Search Box */}
        <div 
          onClick={() => window.dispatchEvent(new Event("opencommandpalette"))} 
          className="relative hidden md:block cursor-pointer"
        >
          <span className="absolute inset-y-0 left-2.5 flex items-center text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            readOnly
            placeholder="Search campaign, devices..."
            className="w-48 pl-8 pr-4 py-1 text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none cursor-pointer focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all duration-300"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-zinc-400 bg-white dark:bg-zinc-850 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-850 shadow-sm pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Notifications - Dynamic Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <div className="hidden lg:block scale-90">
          <ThemeToggle />
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

        {/* Profile User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-zinc-150/40 dark:hover:bg-zinc-900 text-left transition-all cursor-pointer"
          >
            {vendor?.profile_img ? (
              <img
                src={vendor.profile_img}
                alt={vendor.name}
                className="h-7 w-7 rounded-lg object-cover shadow-sm border border-zinc-200/50 dark:border-zinc-800/80"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                {(vendor?.name || "V").split(" ").map((n) => n[0]).join("")}
              </div>
            )}
            <div className="hidden md:block">
              <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">
                {vendor?.name || "Vendor"}
              </div>
              <div className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">
                Store Owner
              </div>
            </div>
            <svg className="w-3 h-3 text-zinc-400 ml-0.5 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-1.5 shadow-2xl animate-scaleUp z-50">
              <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-900 mb-1">
                <span className="text-[8px] uppercase font-bold text-zinc-400 block tracking-wider">Signed in as</span>
                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">{vendor?.name || "Vendor"}</span>
                <span className="text-[9px] text-zinc-450 dark:text-zinc-550 block truncate">{vendor?.email || ""}</span>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profile Settings
              </Link>
              <div className="h-[1px] bg-zinc-150 dark:bg-zinc-900 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
