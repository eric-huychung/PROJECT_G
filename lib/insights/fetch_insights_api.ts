/**
 * Client-side fetch helpers for insight API routes.
 */

import {
  INSIGHTS_RATE_LIMIT_MESSAGE,
  LLM_FETCH_MAX_ATTEMPTS,
  LLM_FETCH_RETRY_BASE_MS,
} from "@/lib/insights/constants";
import {
  assert_llm_not_in_cooldown,
  format_cooldown_message,
  get_llm_cooldown_remaining_ms,
  record_llm_rate_limit,
} from "@/lib/insights/llm_cooldown";
import { insight_rate_limit_error } from "@/lib/insights/insight_errors";
import { wait_for_llm_slot, sleep_ms } from "@/lib/insights/throttle_llm_calls";
import type {
  dataset_schema,
  narrate_response,
  plan_response,
  query_hint,
  query_response,
  result_preview,
} from "@/lib/types/insights";

async function post_json<T>(url: string, body: unknown): Promise<T> {
  assert_llm_not_in_cooldown();

  let last_error = "Insight request failed.";

  for (let attempt = 0; attempt < LLM_FETCH_MAX_ATTEMPTS; attempt += 1) {
    await wait_for_llm_slot();

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as T & { error?: string };

    if (response.ok) {
      return payload;
    }

    last_error = payload.error ?? last_error;

    if (response.status === 429) {
      record_llm_rate_limit();

      if (attempt < LLM_FETCH_MAX_ATTEMPTS - 1) {
        await sleep_ms(LLM_FETCH_RETRY_BASE_MS * (attempt + 1));
        continue;
      }

      throw new insight_rate_limit_error(
        format_cooldown_message(get_llm_cooldown_remaining_ms()) ||
          INSIGHTS_RATE_LIMIT_MESSAGE,
      );
    }

    throw new Error(last_error);
  }

  throw new Error(last_error);
}

/**
 * @param schema - Dataset schema from workspace
 * @param user_prompt - Landing page goal
 */
export function fetch_insight_plan(
  schema: dataset_schema,
  user_prompt: string,
): Promise<plan_response> {
  return post_json<plan_response>("/api/insights/plan", {
    schema,
    user_prompt,
  });
}

/**
 * @param schema - Dataset schema from workspace
 * @param question - Analysis question
 * @param query_hint - Optional failed SQL when retrying one card
 */
export function fetch_insight_query(
  schema: dataset_schema,
  question: string,
  query_hint?: query_hint,
): Promise<query_response> {
  return post_json<query_response>("/api/insights/query", {
    schema,
    question,
    ...(query_hint ? { query_hint } : {}),
  });
}

/**
 * @param question - Original question
 * @param sql - Executed SQL
 * @param result_preview - Capped query rows
 */
export function fetch_insight_narrate(
  question: string,
  sql: string,
  result_preview: result_preview,
): Promise<narrate_response> {
  return post_json<narrate_response>("/api/insights/narrate", {
    question,
    sql,
    result_preview,
  });
}
