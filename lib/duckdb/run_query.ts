/**
 * Runs validated SELECT queries against the uploaded DuckDB table.
 */

import { UPLOADED_TABLE_NAME } from "@/lib/duckdb/constants";
import { get_duckdb } from "@/lib/duckdb/init_duckdb";

const BLOCKED_PATTERN =
  /\b(copy|attach|detach|insert|update|delete|drop|create|alter|pragma|export|import)\b/i;

/** Returns null when the query is safe to run locally. */
export function validate_select_sql(sql: string): string | null {
  const trimmed = sql.trim();

  if (!trimmed) {
    return "SQL is empty.";
  }

  if (trimmed.includes(";")) {
    return "Only a single statement is allowed.";
  }

  if (!/^\s*select\b/i.test(trimmed)) {
    return "Only SELECT queries are allowed.";
  }

  if (BLOCKED_PATTERN.test(trimmed)) {
    return "Query contains a blocked keyword.";
  }

  if (!trimmed.toLowerCase().includes(UPLOADED_TABLE_NAME)) {
    return `Query must reference table ${UPLOADED_TABLE_NAME}.`;
  }

  return null;
}

/**
 * Executes a validated SELECT and returns plain row objects.
 *
 * @param sql - SELECT query targeting `uploaded_data`
 * @returns Array of row records keyed by column name
 */
export async function run_query(
  sql: string,
): Promise<Record<string, unknown>[]> {
  const error = validate_select_sql(sql);
  if (error) {
    throw new Error(error);
  }

  const { conn } = await get_duckdb();
  const result = await conn.query(sql);

  return result.toArray().map((row) => row.toJSON() as Record<string, unknown>);
}
