/**
 * Clipboard helpers for the value trace modal — CSV table and SQL text.
 */

import type { insight_trace_table } from "@/lib/types/discover";

/**
 * Escapes a cell for RFC-style CSV output.
 *
 * @param cell - Raw table cell
 */
function escape_csv_cell(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * @param table - Trace result table
 * @returns CSV string with header row
 */
export function format_trace_table_csv(table: insight_trace_table): string {
  const header = table.columns.map(escape_csv_cell).join(",");
  const body = table.rows.map((row) =>
    row.map((cell) => escape_csv_cell(cell ?? "")).join(","),
  );

  return [header, ...body].join("\n");
}

/**
 * @param sql - Executed SELECT query
 */
export function format_trace_sql(sql: string): string {
  return sql.trim();
}

/**
 * @param text - String to write to the clipboard
 * @returns Whether the copy succeeded
 */
export async function copy_text_to_clipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
