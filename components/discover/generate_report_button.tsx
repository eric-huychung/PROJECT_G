/**
 * Generate report CTA at the bottom of the Discover page.
 */

"use client";

import { FileText } from "lucide-react";

/** UI-only CTA until report generation is wired. */
export function GenerateReportButton() {
  return (
    <div className="flex justify-center pb-4 pt-2">
      <button
        type="button"
        title="Coming soon"
        className="inline-flex items-center gap-2 rounded-2xl bg-g-navy px-8 py-3.5 text-sm font-medium text-g-white transition-colors hover:brightness-110"
      >
        <FileText className="h-4 w-4" />
        Generate report
      </button>
    </div>
  );
}
