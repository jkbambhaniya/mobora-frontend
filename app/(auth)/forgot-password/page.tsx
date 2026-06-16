import React from "react";
import { ForgotPasswordForm } from "@/components/vendor/auth/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recover Password - Mobora",
  description: "Reset your Mobora account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
