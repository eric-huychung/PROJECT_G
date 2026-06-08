/**
 * POST /api/insights/query — SQL and chart spec for one analysis question.
 */

import { generate_insight_json } from "@/lib/insights/api/generate_insight_json";
import { query_request_schema } from "@/lib/insights/api/request_schemas";
import {
  gateway_not_configured_response,
  parse_insight_request,
} from "@/lib/insights/api/route_helpers";
import { insight_api_error_response } from "@/lib/insights/insight_errors";
import {
  build_query_system_prompt,
  build_query_user_prompt,
} from "@/lib/insights/prompts/query_prompt";
import type { query_response } from "@/lib/types/insights";

export const maxDuration = 30;

/** Returns DuckDB SQL and a chart spec for one question. */
export async function POST(req: Request): Promise<Response> {
  const config_error = gateway_not_configured_response();
  if (config_error) {
    return config_error;
  }

  const parsed = await parse_insight_request(req, query_request_schema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const llm = await generate_insight_json<query_response>({
      system: build_query_system_prompt(),
      prompt: build_query_user_prompt(
        parsed.data.schema,
        parsed.data.question,
        parsed.data.query_hint,
      ),
    });

    const sql = llm.sql?.trim() ?? "";
    const chart_spec = llm.chart_spec;

    if (!sql || !chart_spec?.mark || !chart_spec?.x || !chart_spec?.y) {
      throw new Error("Incomplete query response");
    }

    return Response.json({
      sql,
      chart_spec: {
        mark: chart_spec.mark,
        x: chart_spec.x,
        y: chart_spec.y,
      },
    } satisfies query_response);
  } catch (error) {
    return insight_api_error_response(error, "query");
  }
}
