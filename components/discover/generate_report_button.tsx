/**
 * Generate report CTA at the bottom of the Discover page.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";

/** Routes to the report page, preserving dataset query params. */
export function GenerateReportButton() {
  const search_params = useSearchParams();
  const { tracked_insight_count, is_hydrated } = use_tracked_questions();

  const report_href = useMemo(() => {
    const file = search_params.get("file");
    const size = search_params.get("size");

    if (!file) {
      return "/report";
    }

    const params = new URLSearchParams({ file });
    if (size) {
      params.set("size", size);
    }

    return `/report?${params.toString()}`;
  }, [search_params]);

  const can_generate = is_hydrated && tracked_insight_count > 0;

  return (
    <div className="flex flex-col items-center gap-2 pb-4 pt-2">
      {!can_generate && is_hydrated ? (
        <p className="text-xs text-g-gray">
          Track at least one insight to generate a report
        </p>
      ) : null}

      {can_generate ? (
        <Link
          href={report_href}
          className="inline-flex items-center gap-2 rounded-2xl bg-g-navy px-8 py-3.5 text-sm font-medium text-g-white transition-colors hover:brightness-110"
        >
          <FileText className="h-4 w-4" />
          Generate report ({tracked_insight_count})
        </Link>
      ) : (
        <span
          aria-disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-g-navy/40 px-8 py-3.5 text-sm font-medium text-g-white/80"
        >
          <FileText className="h-4 w-4" />
          Generate report
        </span>
      )}
    </div>
  );
}
