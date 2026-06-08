/**
 * Server-only AI Gateway model resolution — reads env, never sent to the client.
 */

/** Recommended default when AI_GATEWAY_MODEL_ID is unset — see .env.example for alternates. */
const DEFAULT_GATEWAY_MODEL_ID = "google/gemini-2.5-flash-lite";

/**
 * @returns Vercel AI Gateway model slug for insight API routes
 */
export function get_insight_gateway_model_id(): string {
  const from_env = process.env.AI_GATEWAY_MODEL_ID?.trim();
  return from_env && from_env.length > 0 ? from_env : DEFAULT_GATEWAY_MODEL_ID;
}
