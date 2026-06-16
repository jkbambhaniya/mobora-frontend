import React from "react";
import { AuthMarketingSide } from "@/components/vendor/auth/auth-marketing-side";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Mobora - Authentication",
  description: "Securely sign in or create your account on Mobora.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Left side: Premium marketing illustration & text slider */}
      <AuthMarketingSide />

      {/* Right side: Dynamic Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative min-h-[500px]">
        {/* Floating Theme Toggle (top right corner) */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Dynamic Glassmorphic Card wrapping the children (page content) */}
        <Card glow className="w-full max-w-[480px] animate-fadeIn">
          {children}
        </Card>

        {/* Footer info in forms */}
        <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Mobora Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
