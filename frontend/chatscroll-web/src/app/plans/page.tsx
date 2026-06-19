"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Check, Rocket, Lock } from "lucide-react";

const FREE_FEATURES = [
  "Unlimited AI conversations",
  "Unlimited Scrolls saved",
  "Full library & folder search",
  "Smart AI folder suggestions",
  "Semantic search (pgvector)",
  "AWS Aurora + ECS backend",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Priority AI responses",
  "Export Scrolls to PDF / Markdown",
  "Team shared libraries",
  "Advanced semantic search filters",
  "Custom folder themes & icons",
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">
            Plans
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Start free, upgrade when you need more. No credit card required.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free plan — current */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/30 rounded-2xl p-7 shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-xs font-semibold bg-amber-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                Current plan
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Free</h2>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-bold text-gray-900 dark:text-slate-100">$0</span>
                <span className="text-sm text-gray-400 dark:text-slate-500 mb-1">/ month</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Free during the hackathon period</p>
            </div>

            <ul className="space-y-2.5 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="w-full py-2.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 text-sm font-medium text-center bg-amber-50/60 dark:bg-amber-950/10">
              ✓ Active
            </div>
          </div>

          {/* Pro plan — coming soon */}
          <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-7 opacity-80">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-xs font-semibold bg-gray-700 dark:bg-slate-700 text-white px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                <Lock className="w-3 h-3" /> Coming soon
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                Pro
                <Rocket className="w-4 h-4 text-amber-500" />
              </h2>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-bold text-gray-900 dark:text-slate-100">$9</span>
                <span className="text-sm text-gray-400 dark:text-slate-500 mb-1">/ month</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Launching after the hackathon</p>
            </div>

            <ul className="space-y-2.5 mb-7">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400 dark:text-slate-500">
                  <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-gray-400 dark:text-slate-600 stroke-[3]" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-sm font-medium cursor-not-allowed"
            >
              Notify me when available
            </button>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center mt-10 text-sm text-gray-400 dark:text-slate-500">
          Questions?{" "}
          <Link href="/" className="text-amber-600 dark:text-amber-400 hover:underline">
            Go back home
          </Link>
        </p>
      </main>
    </div>
  );
}
