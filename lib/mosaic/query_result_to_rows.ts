/**
 * Converts stored query results into row objects for Mosaic charts.
 */

import type { chart_spec, query_result } from "@/lib/types/insights";

/**
 * @param result - DuckDB query result from workspace insight
 * @returns Row objects keyed by column name
 */
export function query_result_to_rows(
  result: query_result,
): Record<string, string | number>[] {
  return result.rows.map((row) => {
    const record: Record<string, string | number> = {};
    for (let index = 0; index < result.columns.length; index += 1) {
      const column = result.columns[index];
      const raw = row[index] ?? "";
      const parsed = Number.parseFloat(raw.replace(/,/g, ""));
      record[column] =
        raw.length > 0 && !Number.isNaN(parsed) && /^-?\d/.test(raw.trim())
          ? parsed
          : raw;
    }
    return record;
  });
}

const MARK_OPTIONS = ["barY", "barX", "line", "dot"] as const;

export type chart_mark = (typeof MARK_OPTIONS)[number];

/**
 * @param mark - Raw mark from chart_spec
 */
export function normalize_chart_mark(mark: string): chart_mark {
  const lower = mark.trim();
  if (MARK_OPTIONS.includes(lower as chart_mark)) {
    return lower as chart_mark;
  }
  return "barY";
}

/**
 * @param columns - Available result columns
 * @param preferred - Preferred column from chart_spec
 */
export function pick_chart_column(columns: string[], preferred: string): string {
  if (columns.includes(preferred)) {
    return preferred;
  }
  return columns[0] ?? preferred;
}

/**
 * @param result - Query result rows
 * @param spec - LLM chart spec
 */
export function resolve_chart_spec(
  result: query_result,
  spec: chart_spec,
): { mark: chart_mark; x: string; y: string } {
  const columns = result.columns;
  return {
    mark: normalize_chart_mark(spec.mark),
    x: pick_chart_column(columns, spec.x),
    y: pick_chart_column(columns, spec.y),
  };
}

export { MARK_OPTIONS };
