/**
 * Insight list and failure helpers — upsert, keys, and SQL error text.
 */

import { normalize_question_text } from "@/lib/insights/pipeline_helpers";
import type { workspace_insight } from "@/lib/types/insights";
import type { insight_sql_failure } from "@/lib/types/workspace";

/**
 * @param insights - Current stored insights
 * @param insight - New or replacement insight for the same question
 */
export function upsert_workspace_insight(
  insights: workspace_insight[],
  insight: workspace_insight,
): workspace_insight[] {
  const key = normalize_question_text(insight.question);
  return [
    ...insights.filter(
      (item) => normalize_question_text(item.question) !== key,
    ),
    insight,
  ];
}

/**
 * @param question - Analysis question text
 */
export function failure_key_for_question(question: string): string {
  return normalize_question_text(question);
}

/**
 * @param error - DuckDB or validation failure
 */
export function extract_sql_error(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * @param existing - Failures already in workspace
 * @param incoming - New failures from a pipeline step
 */
export function merge_insight_failures(
  existing: Record<string, insight_sql_failure> | undefined,
  incoming: Record<string, insight_sql_failure>,
): Record<string, insight_sql_failure> {
  return { ...(existing ?? {}), ...incoming };
}

/**
 * @param failure - Stored DuckDB failure for a question
 */
export function failure_to_query_hint(
  failure: insight_sql_failure,
): { failed_sql: string; error: string } {
  return { failed_sql: failure.sql, error: failure.error };
}

/**
 * @param failures - All stored failures
 * @param question - Question that succeeded
 */
export function clear_failure_for_question(
  failures: Record<string, insight_sql_failure> | undefined,
  question: string,
): Record<string, insight_sql_failure> | undefined {
  if (!failures) {
    return undefined;
  }

  const key = failure_key_for_question(question);
  if (!(key in failures)) {
    return failures;
  }

  const next = { ...failures };
  delete next[key];
  return Object.keys(next).length > 0 ? next : undefined;
}
