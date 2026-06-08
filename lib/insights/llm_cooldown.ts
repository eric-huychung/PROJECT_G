/**
 * Session cooldown after AI gateway 429 — avoids hammering /plan on immediate re-upload.
 */

import {
  INSIGHTS_RATE_LIMIT_MESSAGE,
  LLM_COOLDOWN_MS,
} from "@/lib/insights/constants";
import { insight_rate_limit_error } from "@/lib/insights/insight_errors";

const COOLDOWN_STORAGE_KEY = "project_g_llm_cooldown_until";

/**
 * @param remaining_ms - Milliseconds until the next LLM call is allowed
 */
export function format_cooldown_message(remaining_ms: number): string {
  const seconds = Math.ceil(remaining_ms / 1000);
  if (seconds <= 1) {
    return "AI rate limit — retry in a moment.";
  }
  return `${INSIGHTS_RATE_LIMIT_MESSAGE} Retry in ~${seconds}s.`;
}

/** Marks the session as rate-limited for {@link LLM_COOLDOWN_MS}. */
export function record_llm_rate_limit(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(
    COOLDOWN_STORAGE_KEY,
    String(Date.now() + LLM_COOLDOWN_MS),
  );
}

/**
 * @returns Milliseconds until cooldown expires, or 0 when clear
 */
export function get_llm_cooldown_remaining_ms(): number {
  if (typeof sessionStorage === "undefined") {
    return 0;
  }

  const until = Number(sessionStorage.getItem(COOLDOWN_STORAGE_KEY) ?? 0);
  return Math.max(0, until - Date.now());
}

/** @returns true when a recent 429 is still within the cooldown window */
export function is_in_llm_cooldown(): boolean {
  return get_llm_cooldown_remaining_ms() > 0;
}

/** Throws when the session is still in the post-429 cooldown window. */
export function assert_llm_not_in_cooldown(): void {
  const remaining = get_llm_cooldown_remaining_ms();
  if (remaining > 0) {
    throw new insight_rate_limit_error(format_cooldown_message(remaining));
  }
}

/** Clears cooldown — for tests or after a successful full pipeline run. */
export function clear_llm_cooldown(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(COOLDOWN_STORAGE_KEY);
}
