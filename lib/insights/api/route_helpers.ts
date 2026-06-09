/**
 * Shared helpers for insight API route handlers.
 */

import type { z } from "zod";

import { INSIGHTS_UNAVAILABLE_MESSAGE } from "@/lib/insights/constants";

/** Returns 503 when AI_GATEWAY_API_KEY is missing. */
export function gateway_not_configured_response(): Response | null {
  if (process.env.AI_GATEWAY_API_KEY) {
    return null;
  }

  return Response.json(
    { error: INSIGHTS_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

/**
 * Parses and validates a JSON request body.
 *
 * @param req - Incoming POST request
 * @param schema - Zod schema for the route
 */
export async function parse_insight_request<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  try {
    const data = schema.parse(await req.json());
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: Response.json(
        { error: INSIGHTS_UNAVAILABLE_MESSAGE },
        { status: 400 },
      ),
    };
  }
}
