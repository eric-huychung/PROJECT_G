/**
 * Shared Vercel AI Gateway helpers for insight API routes.
 */

import { generateText, gateway } from "ai";

import { get_insight_gateway_model_id } from "@/lib/insights/gateway_model";
import { INSIGHTS_UNAVAILABLE_MESSAGE } from "@/lib/insights/constants";
import { parse_llm_json } from "@/lib/insights/parse_llm_json";

type generate_insight_options = {
  system: string;
  prompt: string;
};

/**
 * Calls the configured AI Gateway model and parses a JSON object from the response.
 *
 * @param options - System and user prompts
 * @returns Parsed JSON payload
 */
export async function generate_insight_json<T>(
  options: generate_insight_options,
): Promise<T> {
  const text = await generate_insight_raw_text(options);
  return parse_llm_json<T>(text);
}

/**
 * Returns raw model text — used when JSON is optional (narrate).
 *
 * @param options - System and user prompts
 */
export async function generate_insight_raw_text(
  options: generate_insight_options,
): Promise<string> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(INSIGHTS_UNAVAILABLE_MESSAGE);
  }

  const result = await generateText({
    model: gateway(get_insight_gateway_model_id()),
    system: options.system,
    prompt: options.prompt,
    maxRetries: 0,
  });

  return result.text.trim();
}
