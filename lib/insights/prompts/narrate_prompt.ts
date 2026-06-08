/**
 * System and user prompts for narrative generation after local SQL execution.
 */

import type { result_preview } from "@/lib/types/insights";

export function build_narrate_system_prompt(): string {
  return `You write short BizOps insight narratives grounded in query results.

Prefer JSON:
{"narrative": "One or two sentences with key numbers from the preview."}

If JSON is awkward, reply with plain text only — one or two sentences, no markdown.

Rules:
- Use only numbers present in result_preview.
- Be specific — cite top values, counts, or percentages when visible.
- Do not mention SQL or databases.
- Keep under 40 words.`;
}

/**
 * @param question - Original analysis question
 * @param sql - Executed SELECT query
 * @param preview - Capped query result preview
 */
export function build_narrate_user_prompt(
  question: string,
  sql: string,
  preview: result_preview,
): string {
  return `Question: ${question}

SQL (already executed locally):
${sql}

Result preview (${preview.row_count} total rows, showing ${preview.rows.length}):
${JSON.stringify({ columns: preview.columns, rows: preview.rows }, null, 2)}`;
}
