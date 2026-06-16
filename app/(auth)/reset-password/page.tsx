import React from "react";
import { ResetPasswordForm } from "@/components/vendor/auth/reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - Mobora",
  description: "Set your new Mobora password.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
