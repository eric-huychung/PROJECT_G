/**
 * Discover page layout — dataset exploration and question selection.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { GLogo } from "@/components/branding/g_logo";
import { CommonQuestionsSection } from "@/components/discover/common_questions_section";
import { DatasetSummaryCard } from "@/components/discover/dataset_summary_card";
import { DiscoverHeader } from "@/components/discover/discover_header";
import { GenerateReportButton } from "@/components/discover/generate_report_button";
import { QuickInsightsSection } from "@/components/discover/quick_insights_section";
import { DEFAULT_DATASET_SUMMARY } from "@/lib/mock/discover_data";
import type { dataset_summary } from "@/lib/types/discover";

export function DiscoverPage() {
  const search_params = useSearchParams();

  const summary = useMemo((): dataset_summary => {
    const file_name = search_params.get("file");
    const file_size = search_params.get("size");

    if (!file_name) {
      return DEFAULT_DATASET_SUMMARY;
    }

    return {
      ...DEFAULT_DATASET_SUMMARY,
      name: file_name,
      file_size_kb: file_size
        ? Number(file_size)
        : DEFAULT_DATASET_SUMMARY.file_size_kb,
    };
  }, [search_params]);

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
        <DiscoverHeader dataset_name={summary.name} />
        <DatasetSummaryCard summary={summary} />
        <CommonQuestionsSection />
        <QuickInsightsSection />
        <GenerateReportButton />
      </main>
    </div>
  );
}
