"use client";

import React, { useState } from "react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";

interface BusinessDetailsProps {
  initialData: {
    shop_name: string;
    phone: string;
    address: string;
    payment_methods: string;
  };
  onSubmit: (data: {
    shop_name: string;
    phone: string;
    address: string;
    payment_methods: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const businessSchema = yup.object().shape({
  shop_name: yup
    .string()
    .trim()
    .required("Shop/Business Name is required."),
  phone: yup
    .string()
    .trim()
    .required("Contact Phone is required."),
  address: yup
    .string()
    .trim()
    .required("Shop Address is required."),
  payment_methods: yup
    .string()
    .trim()
    .required("Accepted Payment Methods is required."),
});

export const BusinessDetails: React.FC<BusinessDetailsProps> = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      await businessSchema.validate(formData, { abortEarly: false });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Shop / Business Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <input
              type="text"
              name="shop_name"
              value={formData.shop_name}
              onChange={handleChange}
              placeholder="Mobora Prime Electronics"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.shop_name
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.shop_name && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.shop_name}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Business Contact Phone
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
                errors.phone
                  ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                  : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
              }`}
            />
          </div>
          {errors.phone && (
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
              {errors.phone}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Accepted Payment Methods
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </span>
          <input
            type="text"
            name="payment_methods"
            value={formData.payment_methods}
            onChange={handleChange}
            placeholder="UPI, Cards, Cash, NetBanking"
            disabled={isLoading}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
              errors.payment_methods
                ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
            }`}
          />
        </div>
        {errors.payment_methods && (
          <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
            {errors.payment_methods}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Shop Address
        </label>
        <div className="relative">
          <span className="absolute top-3 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            placeholder="Shop 12, Metro Plaza, Bangalore"
            disabled={isLoading}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900/40 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 transition-all ${
              errors.address
                ? "border-red-500/20 bg-red-50/10 dark:bg-red-950/10 focus:ring-red-500/20 focus:border-red-500/30"
                : "border-transparent focus:ring-primary/10 dark:focus:ring-primary/25 focus:border-primary/20 dark:focus:border-primary/40"
            }`}
          />
        </div>
        {errors.address && (
          <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
            {errors.address}
          </span>
        )}
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
