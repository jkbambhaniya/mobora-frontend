"use client";

import React, { useState } from "react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";

interface SecuritySettingsProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required("Current password is required."),
  newPassword: yup
    .string()
    .required("New password is required.")
    .min(8, "Password must be at least 8 characters long.")
    .test(
      "password-strength",
      "Password must contain uppercase, lowercase, number, and special character.",
      (value) => {
        if (!value) return false;
        return (
          /[A-Z]/.test(value) &&
          /[a-z]/.test(value) &&
          /\d/.test(value) &&
          /[^A-Za-z0-9]/.test(value)
        );
      }
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your new password.")
    .oneOf([yup.ref("newPassword")], "Passwords must match."),
});

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await passwordSchema.validate(formData, { abortEarly: false });
      await onSubmit({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      // Clear form on success
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const validationErrors: Record<string, string> = {};
        err.inner.forEach((error) => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setErrors(validationErrors);
      }
    }
  };

  const checks = {
    length: formData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(formData.newPassword),
    lowercase: /[a-z]/.test(formData.newPassword),
    number: /\d/.test(formData.newPassword),
    special: /[^A-Za-z0-9]/.test(formData.newPassword),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.currentPassword
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.currentPassword && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.currentPassword}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.newPassword
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>

          {/* Dynamic checklist */}
          <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/20 space-y-1.5 border border-zinc-100 dark:border-transparent">
            <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-500 block tracking-wider mb-1">Password Strength Checklist</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${checks.length ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={checks.length ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${checks.uppercase ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={checks.uppercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${checks.lowercase ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={checks.lowercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>One lowercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${checks.number ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={checks.number ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>One number</span>
              </div>
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${checks.special ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <span className={checks.special ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>One special character (symbol)</span>
              </div>
            </div>
          </div>

          {errors.newPassword && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.newPassword}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.confirmPassword}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" variant="gradient" size="sm" className="px-6 py-2.5 rounded-xl font-bold" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          ) : (
            "Update Password"
          )}
        </Button>
      </div>
    </form>
  );
};
