/**
 * POST /api/insights/story — executive report story from tracked insights.
 */

import { story_request_schema } from "@/lib/insights/api/request_schemas";
import { generate_insight_json } from "@/lib/insights/api/generate_insight_json";
import {
  gateway_not_configured_response,
  parse_insight_request,
} from "@/lib/insights/api/route_helpers";
import { insight_api_error_response } from "@/lib/insights/insight_errors";
import {
  build_story_system_prompt,
  build_story_user_prompt,
} from "@/lib/insights/prompts/story_prompt";
import { validate_story_response } from "@/lib/insights/validate_story_segments";
import type { story_response } from "@/lib/types/report";

export const maxDuration = 30;

/** Returns a cited executive story for the report page. */
export async function POST(req: Request): Promise<Response> {
  const config_error = gateway_not_configured_response();
  if (config_error) {
    return config_error;
  }

  const parsed = await parse_insight_request(req, story_request_schema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const previews = new Map(
      parsed.data.insights.map((insight) => [
        insight.id,
        insight.result_preview,
      ]),
    );

    const llm = await generate_insight_json<story_response>({
      system: build_story_system_prompt(),
      prompt: build_story_user_prompt(
        parsed.data.user_prompt,
        parsed.data.insights,
      ),
    });

    const story = validate_story_response(llm, previews);
    if (story.segments.length === 0) {
      throw new Error("Empty story segments");
    }

    return Response.json(story satisfies story_response);
  } catch (error) {
    return insight_api_error_response(error, "story");
  }
}
