/**
 * Report page shell — header, canvas, and PDF export.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { GLogo } from "@/components/branding/g_logo";
import { DownloadPdfButton } from "@/components/report/download_pdf_button";
import { ReportCanvas } from "@/components/report/report_canvas";
import { use_report_workspace } from "@/components/report/report_workspace_provider";
import { UserErrorBanner } from "@/components/ui/user_error_banner";

export function ReportPage() {
  const search_params = useSearchParams();
  const { status, error, snapshot } = use_report_workspace();

  const dataset_name = useMemo(() => {
    return (
      search_params.get("file") ??
      snapshot?.file_name ??
      "Your dataset"
    );
  }, [search_params, snapshot]);

  const discover_href = useMemo(() => {
    const file = search_params.get("file") ?? snapshot?.file_name;
    const size =
      search_params.get("size") ??
      (snapshot?.file_size_bytes
        ? String(snapshot.file_size_bytes)
        : null);

    if (!file) {
      return "/discover";
    }

    const params = new URLSearchParams({ file });
    if (size) {
      params.set("size", size);
    }

    return `/discover?${params.toString()}`;
  }, [search_params, snapshot]);

  const show_canvas =
    status === "generating_story" ||
    status === "ready" ||
    status === "error";

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-g-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-neutral-200/50 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-neutral-300/40 blur-3xl" />
      </div>

      <header className="relative z-10 w-full shrink-0 bg-g-navy print:hidden">
        <div className="flex w-full items-center justify-between px-6 py-5 sm:px-8 sm:py-6">
          <Link href="/" className="min-w-0">
            <GLogo />
          </Link>
          <DownloadPdfButton />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-auto px-6 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex items-start justify-between gap-4 print:mb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-g-navy">
              <FileText className="h-5 w-5 text-g-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-g-ink sm:text-2xl">
                Your report
              </h1>
              <p className="truncate text-sm text-g-gray">
                {status === "empty"
                  ? "Track insights on Discover to build your report"
                  : "Verify cited numbers and download as PDF"}
              </p>
            </div>
          </div>

          <Link
            href={discover_href}
            className="glass-chip inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs text-g-gray transition-colors hover:text-g-navy print:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Discover
          </Link>
        </div>

        {error ? (
          <div className="mb-8">
            <UserErrorBanner error={error} />
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="glass-field rounded-3xl p-8 text-center text-sm text-g-gray animate-pulse">
            Loading your report…
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="glass-field rounded-3xl p-8 text-center">
            <p className="mb-2 text-sm font-medium text-g-ink">
              No insights selected yet
            </p>
            <p className="mb-6 text-sm text-g-gray">
              On Discover, click insight cards to track them for your report, then
              return here.
            </p>
            <Link
              href={discover_href}
              className="inline-flex items-center gap-2 rounded-2xl bg-g-navy px-6 py-3 text-sm font-medium text-g-white transition-colors hover:brightness-110"
            >
              Go to Discover
            </Link>
          </div>
        ) : null}

        {show_canvas ? <ReportCanvas dataset_name={dataset_name} /> : null}
      </main>
    </div>
  );
}
