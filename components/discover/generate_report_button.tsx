/**
 * Generate report CTA at the bottom of the Discover page.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

/** Routes to the report page, preserving dataset query params. */
export function GenerateReportButton() {
  const search_params = useSearchParams();

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

  return (
    <div className="flex justify-center pb-4 pt-2">
      <Link
        href={report_href}
        className="inline-flex items-center gap-2 rounded-2xl bg-g-navy px-8 py-3.5 text-sm font-medium text-g-white transition-colors hover:brightness-110"
      >
        <FileText className="h-4 w-4" />
        Generate report
      </Link>
    </div>
  );
}
