/**
 * Template narrative from query preview when the narrate API is unavailable.
 */

import type { result_preview } from "@/lib/types/insights";

/**
 * @param question - Analysis question
 * @param preview - Capped DuckDB result rows
 */
export function build_local_narrative(
  question: string,
  preview: result_preview,
): string {
  if (preview.rows.length === 0) {
    return `No rows matched "${strip_question_mark(question)}." Open Trace to review the SQL.`;
  }

  const label_col = preview.columns[0] ?? "value";
  const value_col = preview.columns[1] ?? preview.columns[0] ?? "value";
  const top = preview.rows[0];
  const label = top[0] ?? "—";
  const value = top[1] ?? top[0] ?? "—";

  if (preview.columns.length === 1) {
    return `${label_col} "${label}" leads with ${preview.row_count} grouped row${preview.row_count === 1 ? "" : "s"}.`;
  }

  return `${label_col} "${label}" has ${value_col} of ${value} (${preview.row_count} row${preview.row_count === 1 ? "" : "s"} total).`;
}

function strip_question_mark(question: string): string {
  return question.trim().replace(/\?+$/, "");
}
