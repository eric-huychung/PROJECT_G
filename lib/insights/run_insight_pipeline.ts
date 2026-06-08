/**
 * Orchestrates plan → query → DuckDB → narrate insight pipeline.
 */

import { UPLOADED_TABLE_NAME } from "@/lib/duckdb/constants";
import { build_local_narrative } from "@/lib/insights/build_local_narrative";
import { build_result_preview, rows_to_query_result } from "@/lib/insights/build_result_preview";
import {
  USE_LLM_NARRATE,
  USE_PARALLEL_INSIGHTS,
  INSIGHTS_RATE_LIMIT_MESSAGE,
} from "@/lib/insights/constants";
import {
  fetch_insight_narrate,
  fetch_insight_plan,
  fetch_insight_query,
} from "@/lib/insights/fetch_insights_api";
import { clear_llm_cooldown } from "@/lib/insights/llm_cooldown";
import {
  insight_rate_limit_error,
  is_insight_rate_limit_error,
} from "@/lib/insights/insight_errors";
import {
  clear_failure_for_question,
  extract_sql_error,
  failure_key_for_question,
  failure_to_query_hint,
  merge_insight_failures,
  upsert_workspace_insight,
} from "@/lib/insights/insight_storage_helpers";
import {
  is_insight_pipeline_complete,
  pending_insight_questions,
} from "@/lib/insights/pipeline_helpers";
import { patch_workspace } from "@/lib/storage/workspace_db";
import type {
  dataset_schema,
  query_hint,
  query_response,
  workspace_insight,
} from "@/lib/types/insights";
import type { insight_sql_failure, workspace_snapshot } from "@/lib/types/workspace";

type insight_pipeline_callbacks = {
  on_plan?: (summary: string, questions: string[]) => void;
  on_insight?: (insight: workspace_insight) => void;
};

type insight_pipeline_result = {
  plan_summary: string;
  suggested_questions: string[];
  insights: workspace_insight[];
  rate_limited: boolean;
};

type query_step_result = {
  question: string;
  payload: query_response;
};

type duckdb_step_result = query_step_result & {
  rows: Record<string, unknown>[];
};

function snapshot_to_schema(snapshot: workspace_snapshot): dataset_schema {
  return {
    table_name: UPLOADED_TABLE_NAME,
    columns: snapshot.columns,
    row_count: snapshot.row_count,
  };
}

function new_insight_id(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param question - Analysis question
 * @param query_payload - LLM SQL + chart spec
 * @param rows - DuckDB result rows
 */
async function finalize_insight(
  question: string,
  query_payload: query_response,
  rows: Record<string, unknown>[],
): Promise<workspace_insight> {
  const preview = build_result_preview(rows);
  let narrative = build_local_narrative(question, preview);

  if (USE_LLM_NARRATE) {
    try {
      const narrate_payload = await fetch_insight_narrate(
        question,
        query_payload.sql,
        preview,
      );
      narrative = narrate_payload.narrative;
    } catch {
      // Keep local narrative when narrate fails.
    }
  }

  return {
    id: new_insight_id(),
    question,
    sql: query_payload.sql,
    chart_spec: query_payload.chart_spec,
    query_result: rows_to_query_result(rows),
    narrative,
    pinned: false,
    created_at: new Date().toISOString(),
  };
}

type single_insight_result = {
  insight: workspace_insight | null;
  sql_failure?: insight_sql_failure;
};

/**
 * Builds one insight: query → DuckDB → narrate.
 *
 * @param schema - Dataset schema
 * @param question - Analysis question (reused on retry — no plan call)
 * @param options - Optional failed SQL hint for token-efficient retry
 */
export async function run_single_insight(
  schema: dataset_schema,
  question: string,
  options?: { query_hint?: query_hint },
): Promise<single_insight_result> {
  let query_payload: query_response;

  try {
    query_payload = await fetch_insight_query(
      schema,
      question,
      options?.query_hint,
    );
  } catch (error) {
    if (is_insight_rate_limit_error(error)) {
      throw error;
    }
    return { insight: null };
  }

  const { run_query } = await import("@/lib/duckdb/run_query");

  try {
    const rows = await run_query(query_payload.sql);
    const insight = await finalize_insight(question, query_payload, rows);
    return { insight };
  } catch (error) {
    return {
      insight: null,
      sql_failure: {
        sql: query_payload.sql,
        error: extract_sql_error(error),
      },
    };
  }
}

/**
 * @param schema - Dataset schema
 * @param pending - Questions without stored insights yet
 */
async function fetch_queries_parallel(
  schema: dataset_schema,
  pending: string[],
): Promise<{ results: query_step_result[]; rate_limited: boolean }> {
  const settled = await Promise.allSettled(
    pending.map(async (question) => {
      const payload = await fetch_insight_query(schema, question);
      return { question, payload };
    }),
  );

  const results: query_step_result[] = [];
  let rate_limited = false;

  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      results.push(entry.value);
      continue;
    }

    if (is_insight_rate_limit_error(entry.reason)) {
      rate_limited = true;
    }
  }

  return { results, rate_limited };
}

/**
 * @param query_results - Successful query payloads
 */
async function run_duckdb_sequential(
  query_results: query_step_result[],
): Promise<{
  results: duckdb_step_result[];
  failures: Record<string, insight_sql_failure>;
}> {
  const { run_query } = await import("@/lib/duckdb/run_query");
  const results: duckdb_step_result[] = [];
  const failures: Record<string, insight_sql_failure> = {};

  for (const item of query_results) {
    try {
      const rows = await run_query(item.payload.sql);
      results.push({ ...item, rows });
    } catch (error) {
      failures[failure_key_for_question(item.question)] = {
        sql: item.payload.sql,
        error: extract_sql_error(error),
      };
    }
  }

  return { results, failures };
}

/**
 * @param duckdb_results - Rows from local SQL execution
 */
async function finalize_insights_parallel(
  duckdb_results: duckdb_step_result[],
): Promise<workspace_insight[]> {
  const settled = await Promise.allSettled(
    duckdb_results.map((item) =>
      finalize_insight(item.question, item.payload, item.rows),
    ),
  );

  const insights: workspace_insight[] = [];

  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      insights.push(entry.value);
    }
  }

  return insights;
}

/**
 * Runs or resumes the insight pipeline from the current workspace snapshot.
 *
 * @param snapshot - Current workspace from IndexedDB
 * @param callbacks - Optional UI hooks as stages complete
 */
export async function run_insight_pipeline(
  snapshot: workspace_snapshot,
  callbacks: insight_pipeline_callbacks = {},
): Promise<insight_pipeline_result> {
  if (is_insight_pipeline_complete(snapshot)) {
    callbacks.on_plan?.(
      snapshot.plan_summary!,
      snapshot.suggested_questions!,
    );
    for (const insight of snapshot.insights ?? []) {
      callbacks.on_insight?.(insight);
    }
    return {
      plan_summary: snapshot.plan_summary!,
      suggested_questions: snapshot.suggested_questions!,
      insights: snapshot.insights ?? [],
      rate_limited: false,
    };
  }

  const schema = snapshot_to_schema(snapshot);
  let plan_summary = snapshot.plan_summary ?? "";
  let suggested_questions = snapshot.suggested_questions ?? [];
  let insights: workspace_insight[] = [...(snapshot.insights ?? [])];
  let insight_failures = { ...(snapshot.insight_failures ?? {}) };

  if (!plan_summary || suggested_questions.length === 0) {
    const plan = await fetch_insight_plan(schema, snapshot.prompt);
    plan_summary = plan.summary;
    suggested_questions = plan.questions;

    await patch_workspace({
      plan_summary,
      suggested_questions,
      insights,
    });

    callbacks.on_plan?.(plan_summary, suggested_questions);
  } else {
    callbacks.on_plan?.(plan_summary, suggested_questions);
  }

  const pending = pending_insight_questions({
    ...snapshot,
    plan_summary,
    suggested_questions,
    insights,
  });

  if (pending.length === 0) {
    clear_llm_cooldown();
    return {
      plan_summary,
      suggested_questions,
      insights,
      rate_limited: false,
    };
  }

  if (USE_PARALLEL_INSIGHTS) {
    const { results: query_results, rate_limited: query_rate_limited } =
      await fetch_queries_parallel(schema, pending);

    if (query_results.length === 0 && query_rate_limited) {
      throw new insight_rate_limit_error(INSIGHTS_RATE_LIMIT_MESSAGE);
    }

    const { results: duckdb_results, failures: duckdb_failures } =
      await run_duckdb_sequential(query_results);
    insight_failures = merge_insight_failures(insight_failures, duckdb_failures);

    const new_insights = await finalize_insights_parallel(duckdb_results);

    for (const insight of new_insights) {
      insights = upsert_workspace_insight(insights, insight);
      insight_failures =
        clear_failure_for_question(insight_failures, insight.question) ??
        {};
      callbacks.on_insight?.(insight);
      await patch_workspace({
        plan_summary,
        suggested_questions,
        insights,
        insight_failures,
      });
    }

    if (Object.keys(duckdb_failures).length > 0 && new_insights.length === 0) {
      await patch_workspace({
        plan_summary,
        suggested_questions,
        insights,
        insight_failures,
      });
    }

    if (query_rate_limited && new_insights.length < pending.length) {
      throw new insight_rate_limit_error(INSIGHTS_RATE_LIMIT_MESSAGE);
    }
  } else {
    let rate_limit_error: insight_rate_limit_error | null = null;

    for (const question of pending) {
      try {
        const result = await run_single_insight(schema, question);
        if (result.sql_failure) {
          insight_failures = merge_insight_failures(insight_failures, {
            [failure_key_for_question(question)]: result.sql_failure,
          });
          await patch_workspace({
            plan_summary,
            suggested_questions,
            insights,
            insight_failures,
          });
          continue;
        }

        if (!result.insight) {
          continue;
        }

        insights = upsert_workspace_insight(insights, result.insight);
        insight_failures =
          clear_failure_for_question(insight_failures, question) ?? {};
        callbacks.on_insight?.(result.insight);

        await patch_workspace({
          plan_summary,
          suggested_questions,
          insights,
          insight_failures,
        });
      } catch (error) {
        if (is_insight_rate_limit_error(error)) {
          rate_limit_error =
            error instanceof insight_rate_limit_error
              ? error
              : new insight_rate_limit_error(INSIGHTS_RATE_LIMIT_MESSAGE);
          break;
        }
        throw error;
      }
    }

    if (rate_limit_error) {
      throw rate_limit_error;
    }
  }

  clear_llm_cooldown();

  return {
    plan_summary,
    suggested_questions,
    insights,
    rate_limited: false,
  };
}

/**
 * Generates one insight for a user-added question and persists it.
 *
 * @param snapshot - Current workspace
 * @param question - Custom question text
 */
export async function add_insight_for_question(
  snapshot: workspace_snapshot,
  question: string,
): Promise<workspace_insight | null> {
  const schema = snapshot_to_schema(snapshot);
  const key = failure_key_for_question(question);
  const stored_failure = snapshot.insight_failures?.[key];
  const query_hint = stored_failure
    ? failure_to_query_hint(stored_failure)
    : undefined;

  try {
    const result = await run_single_insight(schema, question, { query_hint });
    let insight_failures = snapshot.insight_failures;

    if (result.sql_failure) {
      await patch_workspace({
        insight_failures: merge_insight_failures(insight_failures, {
          [key]: result.sql_failure,
        }),
      });
      return null;
    }

    if (!result.insight) {
      return null;
    }

    const insights = upsert_workspace_insight(
      snapshot.insights ?? [],
      result.insight,
    );
    insight_failures = clear_failure_for_question(insight_failures, question);

    await patch_workspace({ insights, insight_failures });
    return result.insight;
  } catch (error) {
    if (is_insight_rate_limit_error(error)) {
      throw error;
    }
    return null;
  }
}

/**
 * Retries one insight for an existing question — query + DuckDB + narrate only.
 *
 * @param snapshot - Current workspace
 * @param question - Existing suggested or custom question text
 */
export async function retry_insight_for_question(
  snapshot: workspace_snapshot,
  question: string,
): Promise<workspace_insight | null> {
  const schema = snapshot_to_schema(snapshot);
  const key = failure_key_for_question(question);
  const stored_failure = snapshot.insight_failures?.[key];
  const query_hint = stored_failure
    ? failure_to_query_hint(stored_failure)
    : undefined;

  try {
    const result = await run_single_insight(schema, question, { query_hint });

    if (result.sql_failure) {
      await patch_workspace({
        insight_failures: merge_insight_failures(snapshot.insight_failures, {
          [key]: result.sql_failure,
        }),
      });
      return null;
    }

    if (!result.insight) {
      return null;
    }

    const insights = upsert_workspace_insight(
      snapshot.insights ?? [],
      result.insight,
    );
    const insight_failures = clear_failure_for_question(
      snapshot.insight_failures,
      question,
    );

    await patch_workspace({ insights, insight_failures });
    return result.insight;
  } catch (error) {
    if (is_insight_rate_limit_error(error)) {
      throw error;
    }
    return null;
  }
}
