/**
 * PDF download control — opens the browser print dialog (Save as PDF).
 */

"use client";

import { Download } from "lucide-react";

/**
 * Triggers the browser print dialog so the user can save the report as PDF.
 */
export function DownloadPdfButton() {
  const handle_download = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handle_download}
      title="Download PDF"
      className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-2xl text-g-navy transition-colors hover:text-g-red print:hidden"
      aria-label="Download PDF"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
