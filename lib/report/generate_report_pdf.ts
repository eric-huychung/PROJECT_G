/**
 * Client-side report PDF generation and browser download trigger.
 */

import { createElement } from "react";

import { capture_chart_images } from "@/lib/report/capture_chart_image";
import type { report_pdf_document_props } from "@/lib/report/build_report_pdf_document";
import type { workspace_insight } from "@/lib/types/insights";
import type { story_segment } from "@/lib/types/report";

export type generate_report_pdf_input = {
  title: string;
  segments: story_segment[];
  dataset_name: string;
  generated_at: string | null;
  insights: workspace_insight[];
};

function report_pdf_filename(
  dataset_name: string,
  generated_at: string | null,
): string {
  const slug = dataset_name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const date = generated_at
    ? new Date(generated_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const base = slug || "dataset";
  return `${base}-report-${date}.pdf`;
}

function format_generated_label(generated_at: string | null): string | null {
  if (!generated_at) {
    return null;
  }

  return new Date(generated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function download_pdf_blob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Captures charts, renders the react-pdf document, and returns a PDF blob.
 *
 * @param input - Story metadata and tracked insights
 * @returns PDF blob ready for download
 */
export async function generate_report_pdf_blob(
  input: generate_report_pdf_input,
): Promise<Blob> {
  const insight_ids = input.insights.map((insight) => insight.id);
  const chart_images = await capture_chart_images(insight_ids);

  const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/report/build_report_pdf_document"),
  ]);

  const document_props: report_pdf_document_props = {
    title: input.title,
    segments: input.segments,
    dataset_name: input.dataset_name,
    generated_label: format_generated_label(input.generated_at),
    insights: input.insights,
    chart_images,
  };

  return pdf(createElement(ReportPdfDocument, document_props)).toBlob();
}

/**
 * Generates and downloads the report PDF in one step.
 *
 * @param input - Story metadata and tracked insights
 * @returns Filename used for the download
 */
export async function download_report_pdf(
  input: generate_report_pdf_input,
): Promise<string> {
  const blob = await generate_report_pdf_blob(input);
  const filename = report_pdf_filename(input.dataset_name, input.generated_at);
  download_pdf_blob(blob, filename);
  return filename;
}
