/**
 * POST /api/insights/plan — dataset summary and suggested questions from schema.
 */

import { generate_insight_json } from "@/lib/insights/api/generate_insight_json";
import { plan_request_schema } from "@/lib/insights/api/request_schemas";
import {
  gateway_not_configured_response,
  parse_insight_request,
} from "@/lib/insights/api/route_helpers";
import { insight_api_error_response } from "@/lib/insights/insight_errors";
import { MAX_INITIAL_INSIGHTS } from "@/lib/insights/constants";
import {
  build_plan_system_prompt,
  build_plan_user_prompt,
} from "@/lib/insights/prompts/plan_prompt";
import type { plan_response } from "@/lib/types/insights";

export const maxDuration = 30;

/** Returns summary + up to {@link MAX_INITIAL_INSIGHTS} suggested questions. */
export async function POST(req: Request): Promise<Response> {
  const config_error = gateway_not_configured_response();
  if (config_error) {
    return config_error;
  }

  const parsed = await parse_insight_request(req, plan_request_schema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const llm = await generate_insight_json<plan_response>({
      system: build_plan_system_prompt(),
      prompt: build_plan_user_prompt(
        parsed.data.schema,
        parsed.data.user_prompt,
      ),
    });

    const summary = llm.summary?.trim() ?? "";
    const questions = (llm.questions ?? [])
      .map((question) => question.trim())
      .filter(Boolean)
      .slice(0, MAX_INITIAL_INSIGHTS);

    if (!summary || questions.length === 0) {
      throw new Error("Incomplete plan response");
    }

    return Response.json({ summary, questions } satisfies plan_response);
  } catch (error) {
    return insight_api_error_response(error, "plan");
  }
}
