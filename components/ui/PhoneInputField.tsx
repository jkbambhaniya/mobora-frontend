"use client";

import React from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

interface PhoneInputFieldProps {
  value: string;
  onChange: (phone: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function PhoneInputField({
  value,
  onChange,
  error,
  placeholder = "98765 43210",
  id = "phone-input",
  disabled = false,
  size = "md",
}: PhoneInputFieldProps) {
  return (
    <div id={id} style={{ width: "100%" }} className={disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}>
      <PhoneInput
        defaultCountry="in"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disableCountryGuess
        disableDialCodePrefill
        forceDialCode
        disabled={disabled}
      />

      {error && (
        <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#ef4444", fontWeight: 500 }}>
          {error}
        </p>
      )}

      <style>{`
        /* ── Row container ───────────────────────────────── */
        #${id} .react-international-phone-input-container {
          display: flex;
          align-items: stretch;
          width: 100%;
          border-radius: ${size === "sm" ? "0.5rem" : "0.75rem"};
          border: 1.5px solid ${error ? "#ef4444" : "#e4e4e7"};
          box-shadow: ${error ? "0 0 0 2px rgb(239 68 68 / 0.2)" : "none"};
          background: transparent;
          font-size: ${size === "sm" ? "0.75rem" : "0.875rem"};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        /* Focus ring */
        #${id} .react-international-phone-input-container:focus-within {
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #6366f1) 30%, transparent);
          outline: none;
        }

        /* ── Country selector button: show flag, no arrow, not clickable ── */
        #${id} .react-international-phone-country-selector-button {
          display: flex;
          align-items: center;
          padding: ${size === "sm" ? "0 0.5rem" : "0 0.6rem 0 0.75rem"};
          background: transparent;
          border: none;
          border-right: 1.5px solid ${error ? "#ef4444" : "#e4e4e7"};
          border-radius: ${size === "sm" ? "0.45rem 0 0 0.45rem" : "0.7rem 0 0 0.7rem"};
          min-height: ${size === "sm" ? "2.125rem" : "2.52rem"};
          flex-shrink: 0;
          /* Make non-interactive — static flag only */
          pointer-events: none;
          cursor: default;
          outline: none;
        }

        /* Hide the dropdown arrow icon */
        #${id} .react-international-phone-country-selector-button__button-content {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        #${id} .react-international-phone-country-selector-arrow {
          display: none !important;
        }


        /* Flag image */
        #${id} .react-international-phone-flag-emoji {
          width: 20px;
          height: 15px;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgb(0 0 0 / 0.1);
          display: block;
          flex-shrink: 0;
        }


        /* ── Text input ─────────────────────────────────── */
        #${id} .react-international-phone-input {
          flex: 1;
          padding: ${size === "sm" ? "7px 12px" : "0.625rem 1rem"};
          background: transparent;
          border: none;
          border-radius: ${size === "sm" ? "0 0.45rem 0.45rem 0" : "0 0.7rem 0.7rem 0"};
          outline: none;
          font-size: ${size === "sm" ? "0.75rem" : "0.875rem"};
          color: inherit;
          min-width: 0;
          line-height: 1.5;
          font-family: inherit;
        }

        #${id} .react-international-phone-input::placeholder {
          color: #a1a1aa;
        }

        /* ── Dark mode ──────────────────────────────────── */
        .dark #${id} .react-international-phone-input-container {
          border-color: ${error ? "#ef4444" : "#27272a"};
          box-shadow: ${error ? "0 0 0 2px rgb(239 68 68 / 0.2)" : "none"};
        }
        .dark #${id} .react-international-phone-input-container:focus-within {
          border-color: var(--color-primary, #6366f1);
        }
        .dark #${id} .react-international-phone-country-selector-button {
          border-right-color: #3f3f46;
        }
        .dark #${id} .react-international-phone-country-selector-button__button-content::after {
          color: #a1a1aa;
        }
        .dark #${id} .react-international-phone-input {
          color: #f4f4f5;
        }
        .dark #${id} .react-international-phone-input::placeholder {
          color: #71717a;
        }
      `}</style>
    </div>
  );
}
