"use client";

import LandingHeader from "@/components/landing-header";
import LandingFooter from "@/components/landing-footer";

export default function TermsPage() {
  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 min-h-screen relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-secondary/10 dark:bg-secondary/5 blur-[100px] pointer-events-none" />

      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Compliance Desk</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Last Updated: July 4, 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm text-zinc-650 dark:text-zinc-400 space-y-8 leading-relaxed text-left">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1. Acceptance and Scope</h2>
            <p>
              By registering, accessing, or using the Mobora software and services, you and your business entity agree to be bound by these Terms and Conditions. These terms govern all inventory logs, user invites, evaluation desk operations, and custom valuation configuration edits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">2. Vendor Account Integrity</h2>
            <p>
              To access our service, you must complete the vendor registration. You agree to provide accurate registration details, update them when store details change, and secure clerk passwords. Any activity under your store domain is your primary liability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">3. Device Valuations Disclaimer</h2>
            <p>
              Valuation metrics calculated by Mobora are estimates based on catalog inputs and condition modifiers. You agree that Mobora has no control over local retail factors, does not purchase smartphones, and is not responsible if a transaction results in a store margin loss.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">4. Stolen Device and Blacklist Checks</h2>
            <p>
              You agree to verify customer consent before checking device IMEIs. Using Mobora to execute illegal searches or log devices known to be obtained fraudulently is a violation of these terms and will lead to immediate account suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">5. Fees and Recurring Billing</h2>
            <p>
              Subscription plans (Starter, Growth, Pro) are billed monthly in advance. Payments are non-refundable after the billing cycle starts. You can cancel or change plans via your billing dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Mobora will not be liable for any indirect, special, incidental, or consequential damages (including loss of business profits, data corruption, or store database downtime) arising from the use of our services.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
