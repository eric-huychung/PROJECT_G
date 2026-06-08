/**
 * System and user prompts for the insight plan stage.
 */

import { MAX_INITIAL_INSIGHTS } from "@/lib/insights/constants";
import type { dataset_schema } from "@/lib/types/insights";

export function build_plan_system_prompt(): string {
  return `You analyze CSV dataset schemas for BizOps users. Respond with JSON only — no markdown fences, no commentary.

Output shape:
{
  "summary": "2-3 sentences describing what this dataset likely contains and what analyses fit",
  "questions": ["question 1?", "question 2?", "question 3?", "question 4?"]
}

Rules:
- Use only column names from the schema.
- Questions must be answerable with SQL aggregations on one table.
- Each question ends with ?.
- Provide exactly ${MAX_INITIAL_INSIGHTS} questions.
- Do not invent column values or statistics.`;
}

/**
 * @param schema - Table schema from DuckDB ingest
 * @param user_prompt - Goal from the landing prompt bar
 */
export function build_plan_user_prompt(
  schema: dataset_schema,
  user_prompt: string,
): string {
  const columns = schema.columns
    .map((column) => `${column.name} (${column.type})`)
    .join(", ");

  return `Table: ${schema.table_name}
Rows: ${schema.row_count}
Columns: ${columns}

User goal: ${user_prompt || "Explore this dataset for useful BizOps insights."}`;
}
