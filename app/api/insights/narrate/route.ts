/**
 * POST /api/insights/narrate — insight narrative from query result preview.
 */

import { generate_insight_raw_text } from "@/lib/insights/api/generate_insight_json";
import { narrate_request_schema } from "@/lib/insights/api/request_schemas";
import {
  gateway_not_configured_response,
  parse_insight_request,
} from "@/lib/insights/api/route_helpers";
import { insight_api_error_response } from "@/lib/insights/insight_errors";
import { parse_narrative_from_llm } from "@/lib/insights/parse_narrative_response";
import {
  build_narrate_system_prompt,
  build_narrate_user_prompt,
} from "@/lib/insights/prompts/narrate_prompt";
import type { narrate_response } from "@/lib/types/insights";

export const maxDuration = 30;

/** Returns a short narrative grounded in executed query preview rows. */
export async function POST(req: Request): Promise<Response> {
  const config_error = gateway_not_configured_response();
  if (config_error) {
    return config_error;
  }

  const parsed = await parse_insight_request(req, narrate_request_schema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const raw = await generate_insight_raw_text({
      system: build_narrate_system_prompt(),
      prompt: build_narrate_user_prompt(
        parsed.data.question,
        parsed.data.sql,
        parsed.data.result_preview,
      ),
    });

    const narrative = parse_narrative_from_llm(raw);
    if (!narrative) {
      throw new Error("Empty narrative");
    }

    return Response.json({ narrative } satisfies narrate_response);
  } catch (error) {
    return insight_api_error_response(error, "narrate");
  }
}
