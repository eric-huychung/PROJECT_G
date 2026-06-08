/**
 * Shared constants for insight generation via Vercel AI Gateway.
 *
 * Model slug: server-only via AI_GATEWAY_MODEL_ID in .env (see lib/insights/gateway_model.ts).
 */

/** Max suggested questions to turn into insights on first load. */
export const MAX_INITIAL_INSIGHTS = 4;

/**
 * When false, narratives come from local query results only (5 LLM calls vs 9).
 * Requires paid AI Gateway credits for reliable narrate calls at scale.
 */
export const USE_LLM_NARRATE = true;

/** Run pending insights in parallel (query + narrate). Safe with paid AI Gateway credits. */
export const USE_PARALLEL_INSIGHTS = true;

/** Max rows sent to the narrate endpoint. */
export const MAX_PREVIEW_ROWS = 10;

/** Pause between LLM calls — 0 when parallel + paid credits; raise if 429s return. */
export const LLM_CALL_GAP_MS = USE_PARALLEL_INSIGHTS ? 0 : 4000;

/** Client retries when the gateway returns 429. */
export const LLM_FETCH_MAX_ATTEMPTS = 2;

/** Backoff base for 429 retries (ms). */
export const LLM_FETCH_RETRY_BASE_MS = 8000;

/** Session cooldown after a 429 before any new LLM call (incl. re-upload → /plan). */
export const LLM_COOLDOWN_MS = 90_000;

export const INSIGHTS_UNAVAILABLE_MESSAGE =
  "We couldn't reach the analysis service. Check your connection and try again.";

export const INSIGHTS_RATE_LIMIT_MESSAGE =
  "Analysis hit the AI rate limit. Wait and retry, or check your gateway credits.";
