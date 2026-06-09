/**
 * Builds trace modal payloads from stored workspace insights.
 */

import type { insight_trace, insight_trace_highlight } from "@/lib/types/discover";
import type { workspace_insight } from "@/lib/types/insights";

function find_highlight(
  columns: string[],
  rows: string[][],
): { row: number; col: number } {
  let best_row = 0;
  let best_col = 0;
  let best_value = Number.NEGATIVE_INFINITY;

  for (let row_index = 0; row_index < rows.length; row_index += 1) {
    for (let col_index = 0; col_index < columns.length; col_index += 1) {
      const parsed = Number.parseFloat(rows[row_index][col_index]?.replace(/,/g, "") ?? "");
      if (!Number.isNaN(parsed) && parsed > best_value) {
        best_value = parsed;
        best_row = row_index;
        best_col = col_index;
      }
    }
  }

  return { row: best_row, col: best_col };
}

/**
 * @param insight - Stored workspace insight
 * @param highlight - Optional cell highlight from story cite
 * @returns Trace payload for ValueTraceModal
 */
export function build_insight_trace(
  insight: workspace_insight,
  highlight?: insight_trace_highlight,
): insight_trace {
  const resolved_highlight =
    highlight ??
    find_highlight(insight.query_result.columns, insight.query_result.rows);

  return {
    insight_id: insight.id,
    label: "Value trace",
    primary_value:
      insight.query_result.rows[resolved_highlight.row]?.[resolved_highlight.col] ||
      "—",
    last_updated: new Date(insight.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    table: {
      columns: insight.query_result.columns,
      rows: insight.query_result.rows,
      highlight: resolved_highlight,
    },
    sql: insight.sql,
  };
}
