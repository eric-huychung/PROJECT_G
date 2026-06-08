/**
 * Trims DuckDB query rows into a small preview for the narrate API.
 */

import { MAX_PREVIEW_ROWS } from "@/lib/insights/constants";
import type { query_result, result_preview } from "@/lib/types/insights";

/** Formats a cell value for preview and trace tables. */
export function format_cell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/**
 * @param rows - Raw DuckDB row objects
 * @param max_rows - Cap for narrate payload
 * @returns Preview with string cells
 */
export function build_result_preview(
  rows: Record<string, unknown>[],
  max_rows = MAX_PREVIEW_ROWS,
): result_preview {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const preview_rows = rows.slice(0, max_rows).map((row) =>
    columns.map((column) => format_cell(row[column])),
  );

  return {
    columns,
    rows: preview_rows,
    row_count: rows.length,
  };
}

/**
 * Converts raw DuckDB rows into stored query_result for trace modal.
 *
 * @param rows - Full query result from DuckDB
 * @returns Columns + string rows for UI
 */
export function rows_to_query_result(
  rows: Record<string, unknown>[],
): query_result {
  const preview = build_result_preview(rows, rows.length);
  return {
    columns: preview.columns,
    rows: preview.rows,
  };
}
