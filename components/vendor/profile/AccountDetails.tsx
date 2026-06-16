"use client";

import React, { useState } from "react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";

interface AccountDetailsProps {
  initialData: {
    name: string;
    email: string;
  };
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
  isLoading: boolean;
}

const accountSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Full Name is required."),
  email: yup
    .string()
    .trim()
    .required("Email is required.")
    .email("Please enter a valid email address."),
});

export const AccountDetails: React.FC<AccountDetailsProps> = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(initialData);
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
      await accountSchema.validate(formData, { abortEarly: false });
      await onSubmit(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Full Name / Contact Person
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.name && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.name}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.email && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.email}
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
              Saving...
            </div>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
};
