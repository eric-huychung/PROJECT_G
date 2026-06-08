/**
 * Formats dataset summary stats for the Discover page.
 */

import type { dataset_summary } from "@/lib/types/discover";

/**
 * @param summary - Dataset row/column counts and file size
 * @returns Human-readable stats line for the summary card
 */
export function format_dataset_stats_line(summary: dataset_summary): string {
  const rows = summary.rows.toLocaleString();
  const size_mb = (summary.file_size_kb / 1024).toFixed(1);
  return `${rows} rows · ${summary.columns} columns · ${size_mb} MB`;
}
