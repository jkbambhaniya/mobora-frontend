import React from "react";
import { RegisterForm } from "@/components/vendor/auth/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account - Mobora",
  description: "Register for a free Mobora account and launch campaigns.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
