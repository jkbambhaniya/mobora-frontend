"use client";

import LandingHeader from "@/components/landing-header";
import LandingFooter from "@/components/landing-footer";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Last Updated: July 4, 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm text-zinc-650 dark:text-zinc-400 space-y-8 leading-relaxed text-left">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">1. Introduction & Overview</h2>
            <p>
              Welcome to Mobora. We are committed to protecting the privacy and security of your business data as well as the device parameters processed in your stores. This Privacy Policy details how we collect, process, store, and transfer information when you register as a vendor and utilize our evaluation catalog tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">2. The Information We Collect</h2>
            <p>
              We collect multiple categories of information to ensure proper functioning of our vendor platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Vendor Business Information:</strong> Shop name, corporate email address, contact telephone numbers, business registration tax IDs, and cash drawer balances.
              </li>
              <li>
                <strong>Clerk Access Details:</strong> Account usernames, active system session logs, IP addresses, and login locations.
              </li>
              <li>
                <strong>Device Evaluation Records:</strong> Device brand, model variants, memory storage allocations, physical device cosmetic grades, battery capacities, serial tracking tags, and International Mobile Equipment Identity (IMEI) parameters.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">3. Methods of Data Collection</h2>
            <p>
              We acquire information through direct user entry (for example, typing a smartphone specification into the valuation tool), automated diagnostic queries (when executing checking APIs), and webhook responses from connected POS channels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">4. Legal Bases for Processing Data</h2>
            <p>
              We process business and device details under standard legal frameworks, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Performance of Contract:</strong> To maintain your active store listing catalog and fulfill transactions.</li>
              <li><strong>Legal Obligation:</strong> To maintain record verification sheets and prevent trading of reported/stolen smartphones.</li>
              <li><strong>Legitimate Interests:</strong> To optimize valuation multipliers and audit catalog anomalies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">5. Third-Party Sharing</h2>
            <p>
              Mobora does not sell or lease vendor inventory records. We share data only with third-party verification networks (for checking device blacklist metrics) and standard payment processors used to execute trade balances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">6. Data Retention Policies</h2>
            <p>
              We retain device history logs and evaluations for as long as your vendor account remains active, or for up to five (5) years following closure to comply with municipal second-hand dealer record laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">7. Your Choices and Rights</h2>
            <p>
              Under relevant privacy laws, you have the right to request access to your catalog data, correct errors in transaction reports, or request deletion of account logs where legal retention limits allow. Contact our support desk to submit requests.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
