import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className="relative w-full max-w-[480px]">
      <div
        className={`relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-slate-900 shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black/60 p-8 transition-all duration-300 ${className}`}
      >
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};
