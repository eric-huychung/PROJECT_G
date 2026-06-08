/**
 * System and user prompts for SQL + chart spec generation.
 */

import type { dataset_schema, query_hint } from "@/lib/types/insights";

/** DuckDB identifier quoting for schema column names. */
function format_column_for_sql(name: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return name;
  }
  return `"${name.replace(/"/g, '""')}"`;
}

function format_columns_block(schema: dataset_schema): string {
  return schema.columns
    .map((column) => {
      const sql_name = format_column_for_sql(column.name);
      return `- ${sql_name} (${column.type})`;
    })
    .join("\n");
}

export function build_query_system_prompt(): string {
  return `You write DuckDB SQL for BizOps analysis. Respond with JSON only — no markdown fences.

Output shape:
{
  "sql": "SELECT ... FROM uploaded_data ...",
  "chart_spec": { "mark": "barY", "x": "column_name", "y": "column_name" }
}

Rules:
- Single SELECT statement only — no semicolons, no DDL/DML.
- Must query table uploaded_data only.
- Use valid DuckDB syntax.
- Use column names EXACTLY as listed in the schema — never rename, abbreviate, or replace spaces with underscores.
- Wrap identifiers in double quotes when the name contains spaces, punctuation, or mixed case (e.g. "Deal Size", "Lead Source").
- chart_spec.mark is one of: barY, barX, line, dot.
- chart_spec.x and chart_spec.y must match output column aliases.
- LIMIT 20 unless the question needs fewer rows.
- Use only columns that exist in the schema.`;
}

/**
 * @param schema - Table schema from DuckDB ingest
 * @param question - Analysis question to answer
 * @param query_hint - Optional failed SQL + error when retrying one question
 */
export function build_query_user_prompt(
  schema: dataset_schema,
  question: string,
  query_hint?: query_hint,
): string {
  const columns_block = format_columns_block(schema);

  const retry_block = query_hint
    ? `

Previous SQL failed — fix it using the exact column identifiers above:
SQL: ${query_hint.failed_sql}
Error: ${query_hint.error}`
    : "";

  return `Table: ${schema.table_name}
Rows: ${schema.row_count}
Columns (use these identifiers exactly in SQL):
${columns_block}

Question: ${question}${retry_block}`;
}
