/**
 * Discover page layout — dataset exploration and insight generation.
 */

"use client";

import Link from "next/link";

import { GLogo } from "@/components/branding/g_logo";
import { DatasetSummaryCard } from "@/components/discover/dataset_summary_card";
import { DiscoverHeader } from "@/components/discover/discover_header";
import { GenerateReportButton } from "@/components/discover/generate_report_button";
import {
  use_insights_workspace,
} from "@/components/discover/insights_workspace_provider";
import { SuggestedQuestionsInsightsSection } from "@/components/discover/suggested_questions_insights_section";
import { UserErrorBanner } from "@/components/ui/user_error_banner";

export function DiscoverPage() {
  const {
    status,
    error,
    summary,
    plan_summary,
  } = use_insights_workspace();

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-g-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-neutral-200/50 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-neutral-300/40 blur-3xl" />
      </div>

      <header className="relative z-10 w-full shrink-0 bg-g-navy">
        <div className="flex w-full items-center px-6 py-5 sm:px-8 sm:py-6">
          <Link href="/" className="min-w-0">
            <GLogo />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-auto px-6 py-10 sm:px-8 sm:py-14">
        {status === "loading" ? (
          <p className="mb-8 text-sm text-g-gray">Loading dataset…</p>
        ) : null}

        {status === "empty" ? (
          <div className="mb-8 rounded-3xl border border-dashed border-neutral-300 bg-g-white/60 p-8 text-center">
            <p className="text-g-ink">No dataset found on this device.</p>
            <p className="mt-2 text-sm text-g-gray">
              Drop a CSV on the landing page to get started.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-g-red hover:text-g-red-hover"
            >
              Go to landing
            </Link>
          </div>
        ) : null}

        {status === "error" && error ? (
          <div className="mb-8">
            <UserErrorBanner error={error} />
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-g-red hover:text-g-red-hover"
            >
              Upload a new CSV
            </Link>
          </div>
        ) : null}

        {summary && status !== "empty" && status !== "error" ? (
          <>
            {error ? (
              <div className="mb-8">
                <UserErrorBanner error={error} />
              </div>
            ) : null}
            <DiscoverHeader dataset_name={summary.name} />
            <DatasetSummaryCard
              summary={summary}
              plan_summary={plan_summary}
              is_generating={status === "generating" && !plan_summary}
            />
            <SuggestedQuestionsInsightsSection />
            <GenerateReportButton />
          </>
        ) : null}
      </main>
    </div>
  );
}
