"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface PendingReviewProps {
  statusFeedback: string | null;
  isCheckingStatus: boolean;
  onCheckStatus: () => void;
  onBackToSignIn: () => void;
}

export const PendingReview: React.FC<PendingReviewProps> = ({
  statusFeedback,
  isCheckingStatus,
  onCheckStatus,
  onBackToSignIn,
}) => {
  return (
    <div className="w-full text-center space-y-6 py-4 animate-scaleUp">
      {/* Glow effect on icon container */}
      <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-md animate-[pulse_3s_infinite_alternate]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-8 h-8 animate-[spin_20s_linear_infinite]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
          Application Under Review
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
          Your Mobora Dealer registration is pending administrator approval. We verify all dealer applications to ensure platform security.
        </p>
      </div>

      {/* Stepper Status Indicators */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/80 rounded-2xl p-5 text-left space-y-4 max-w-md mx-auto backdrop-blur-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
          Application Pipeline
        </h3>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Registration Completed
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Account details registered successfully.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold animate-[pulse_1.5s_infinite]">
              •
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                Identity Verification
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full font-bold uppercase tracking-wide">
                  Active
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Administrator checking business details. Typically completes within 24h.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 opacity-50">
            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 flex items-center justify-center shrink-0 text-xs font-bold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Portal Access Activated
              </h4>
              <p className="text-[11px] text-zinc-450 dark:text-zinc-500">
                Access catalog, execute trade-ins, and view metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-semibold animate-fadeIn max-w-md mx-auto">
          {statusFeedback}
        </div>
      )}

      <div className="space-y-3 pt-2 max-w-xs mx-auto">
        <Button
          onClick={onCheckStatus}
          isLoading={isCheckingStatus}
          variant="gradient"
          className="w-full"
        >
          Check Status Now
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-450 pt-2">
          <button
            onClick={onBackToSignIn}
            className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
          >
            Back to Sign In
          </button>
          <span className="text-zinc-300 dark:text-zinc-800">•</span>
          <a
            href="mailto:support@mobora.com?subject=Dealer%20Account%20Review"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};
