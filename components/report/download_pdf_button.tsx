/**
 * PDF download control — client-side react-pdf export from report workspace data.
 */

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { use_report_workspace } from "@/components/report/report_workspace_provider";
import { download_report_pdf } from "@/lib/report/generate_report_pdf";

type download_pdf_button_props = {
  dataset_name: string;
};

/**
 * @param props - Dataset label shown in the PDF footer
 */
export function DownloadPdfButton({ dataset_name }: download_pdf_button_props) {
  const { status, story, tracked_insights } = use_report_workspace();
  const [is_exporting, set_is_exporting] = useState(false);
  const [export_error, set_export_error] = useState<string | null>(null);

  const is_ready =
    status === "ready" && tracked_insights.length > 0 && story !== null;

  const handle_download = async () => {
    if (!is_ready || is_exporting || !story) {
      return;
    }

    set_is_exporting(true);
    set_export_error(null);

    try {
      await download_report_pdf({
        title: story.title,
        segments: story.segments,
        dataset_name,
        generated_at: story.generated_at,
        insights: tracked_insights,
      });
    } catch (caught) {
      set_export_error(
        caught instanceof Error
          ? caught.message
          : "Could not generate the PDF. Try again.",
      );
    } finally {
      set_is_exporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 print:hidden">
      <button
        type="button"
        onClick={handle_download}
        disabled={!is_ready || is_exporting}
        title={is_exporting ? "Preparing PDF…" : "Download report PDF"}
        className="glass-chip inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-2xl px-3 text-g-navy transition-colors hover:text-g-red disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={is_exporting ? "Preparing PDF" : "Download report PDF"}
      >
        {is_exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {is_exporting ? (
          <span className="hidden text-xs sm:inline">Preparing…</span>
        ) : null}
      </button>
      {export_error ? (
        <p className="max-w-[12rem] text-right text-[10px] leading-snug text-g-red/90">
          {export_error}
        </p>
      ) : null}
    </div>
  );
}
