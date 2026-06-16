import React from "react";
import { LoginForm } from "@/components/vendor/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Mobora",
  description: "Sign in to your Mobora account to manage your campaigns.",
};

export default function LoginPage() {
  return <LoginForm />;
}
