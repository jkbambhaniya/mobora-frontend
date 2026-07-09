"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface SuspendedAccountProps {
  onBackToSignIn: () => void;
}

export const SuspendedAccount: React.FC<SuspendedAccountProps> = ({
  onBackToSignIn,
}) => {
  return (
    <div className="w-full text-center space-y-6 py-6 animate-scaleUp">
      {/* Glow effect on icon container */}
      <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 bg-red-500/20 dark:bg-red-500/10 rounded-full blur-md animate-[pulse_3s_infinite_alternate]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-200/50 dark:border-red-500/20 shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-550 bg-gradient-to-r from-red-650 via-red-500 to-red-400 bg-clip-text text-transparent">
          Account Suspended
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
          Your dealer account has been suspended by an administrator due to a policy violation or outstanding verification issue.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold max-w-md mx-auto">
        Please reach out to support if you believe this is an error or to verify your business credentials.
      </div>

      <div className="space-y-3 pt-4 max-w-xs mx-auto">
        <a
          href="mailto:support@mobora.com?subject=Suspended%20Dealer%20Account"
          className="block w-full animate-[bounce_5s_infinite]"
        >
          <Button
            variant="gradient"
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 border border-red-500/10 shadow-red-500/20 hover:shadow-red-500/30"
          >
            Contact Support
          </Button>
        </a>

        <button
          onClick={onBackToSignIn}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-750 dark:text-zinc-455 dark:hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none pt-2"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
