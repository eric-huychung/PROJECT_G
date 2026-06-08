/**
 * Insight error types and API response mapping — shared by routes and client pipeline.
 */

import {
  INSIGHTS_RATE_LIMIT_MESSAGE,
  INSIGHTS_UNAVAILABLE_MESSAGE,
} from "@/lib/insights/constants";

/** Client-side signal that the AI gateway returned 429. */
export class insight_rate_limit_error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "insight_rate_limit_error";
  }
}

/**
 * @param error - Caught fetch, gateway, or pipeline failure
 */
export function is_insight_rate_limit_error(error: unknown): boolean {
  if (error instanceof insight_rate_limit_error) {
    return true;
  }

  const text = extract_error_text(error).toLowerCase();
  return (
    text.includes("rate_limit") ||
    text.includes("rate-limited") ||
    text.includes("rate limit")
  );
}

/**
 * Maps caught route errors to a safe JSON response (no stack traces to client).
 *
 * @param error - Caught gateway or parse failure
 * @param route_label - Short label for server logs
 */
export function insight_api_error_response(
  error: unknown,
  route_label: string,
): Response {
  console.error(`Insights ${route_label}:`, error);

  if (is_insight_rate_limit_error(error)) {
    return Response.json(
      { error: INSIGHTS_RATE_LIMIT_MESSAGE },
      { status: 429 },
    );
  }

  return Response.json(
    { error: INSIGHTS_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

function extract_error_text(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const parts = [error.message];
  let current: unknown = error;

  for (let depth = 0; depth < 4; depth += 1) {
    const cause = current instanceof Error ? current.cause : undefined;
    if (!(cause instanceof Error)) {
      break;
    }
    parts.push(cause.message);
    current = cause;
  }

  return parts.join(" ");
}
