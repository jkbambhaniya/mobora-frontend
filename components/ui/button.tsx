"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "pill" | "square";
  glow?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  shape = "rounded",
  glow = true,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-zinc-950 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

  const shapes = {
    rounded: "rounded-xl",
    pill: "rounded-full",
    square: "rounded-none",
  };

  const sizes = {
    sm: shape === "pill" ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-sm",
    md: shape === "pill" ? "px-6 py-2.5 text-base" : "px-5 py-2.5 text-base",
    lg: shape === "pill" ? "px-8 py-3.5 text-lg" : "px-7 py-3 text-lg",
  };

  const variants = {
    primary:
      "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 hover:-translate-y-0.5 border border-zinc-900/10 dark:border-zinc-100/10",
    secondary:
      "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 hover:-translate-y-0.5 border border-zinc-200/20 dark:border-zinc-700/20",
    outline:
      "border border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-50/80 hover:-translate-y-0.5",
    ghost:
      "hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900",
    gradient:
      "bg-gradient-to-r from-primary to-secondary hover:brightness-105 text-white hover:-translate-y-0.5 border border-primary/10 transition-all duration-300",
    success:
      "bg-emerald-500 hover:bg-emerald-600 text-white hover:-translate-y-0.5 border border-emerald-500/10",
    danger:
      "bg-red-500 hover:bg-red-600 text-white hover:-translate-y-0.5 border border-red-500/10",
    warning:
      "bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5 border border-amber-500/10",
  };

  const glows = {
    primary: "shadow-md shadow-zinc-950/10 dark:shadow-zinc-950/30",
    secondary: "shadow-sm shadow-zinc-200/50 dark:shadow-zinc-900/20",
    outline: "",
    ghost: "",
    gradient:
      "shadow-[0_8px_20px_-6px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.65)] dark:shadow-[0_8px_20px_-6px_rgba(6,182,212,0.3)] dark:hover:shadow-[0_12px_24px_-4px_rgba(6,182,212,0.5)]",
    success:
      "shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)] hover:shadow-[0_12px_24px_-4px_rgba(16,185,129,0.65)]",
    danger:
      "shadow-[0_8px_20px_-6px_rgba(239,68,68,0.45)] hover:shadow-[0_12px_24px_-4px_rgba(239,68,68,0.65)]",
    warning:
      "shadow-[0_8px_20px_-6px_rgba(245,158,11,0.45)] hover:shadow-[0_12px_24px_-4px_rgba(245,158,11,0.65)]",
  };

  const glowClass = glow && !disabled && !isLoading ? glows[variant] : "";

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${shapes[shape]} ${variants[variant]} ${glowClass} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      {children}
      {!isLoading && rightIcon ? (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
};
