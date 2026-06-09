/**
 * System and user prompts for report story generation.
 */

import type { result_preview } from "@/lib/types/insights";

export type story_insight_input = {
  id: string;
  question: string;
  narrative: string;
  result_preview: result_preview;
};

export function build_story_system_prompt(): string {
  return `You write short executive report stories for BizOps analysts.

Respond with JSON only — no markdown fences.

Output shape:
{
  "title": "Short report headline",
  "segments": [
    { "type": "text", "value": "Plain prose. " },
    {
      "type": "cite",
      "insight_id": "exact id from input",
      "label": "exact cell value as shown in preview",
      "row": 0,
      "col": 1
    },
    { "type": "text", "value": " More prose." }
  ]
}

Rules:
- Write in the voice of the user's stated goal.
- Synthesize ONLY the provided insights — 2–4 sentences total in segments.
- Every number or key metric in the story MUST use a cite segment — no bare numbers in text segments.
- cite.insight_id must match an input insight id exactly.
- cite.row and cite.col are zero-based indexes into that insight's result_preview rows/columns.
- cite.label must match the preview cell value exactly (same formatting).
- Alternate text and cite segments; text segments should not contain digits when a cite is available.
- Keep title under 12 words.`;
}

/**
 * @param user_prompt - Landing page goal / persona
 * @param insights - Tracked insights with capped previews
 */
export function build_story_user_prompt(
  user_prompt: string,
  insights: story_insight_input[],
): string {
  const insight_blocks = insights
    .map(
      (insight) => `Insight id: ${insight.id}
Question: ${insight.question}
Narrative: ${insight.narrative}
Result preview (${insight.result_preview.row_count} total rows, showing ${insight.result_preview.rows.length}):
${JSON.stringify(
        {
          columns: insight.result_preview.columns,
          rows: insight.result_preview.rows,
        },
        null,
        2,
      )}`,
    )
    .join("\n\n---\n\n");

  return `User goal: ${user_prompt || "Explore this dataset for useful BizOps insights."}

Tracked insights:

${insight_blocks}`;
}
