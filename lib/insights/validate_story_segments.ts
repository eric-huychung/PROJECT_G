/**
 * Validates and sanitizes LLM story segments against tracked insight previews.
 */

import type { result_preview } from "@/lib/types/insights";
import type { story_response, story_segment } from "@/lib/types/report";

type insight_preview_map = Map<string, result_preview>;

function normalize_cell(value: string): string {
  return value.trim();
}

function cell_matches_label(preview: result_preview, row: number, col: number, label: string): boolean {
  const cell = preview.rows[row]?.[col];
  if (cell == null) {
    return false;
  }
  return normalize_cell(cell) === normalize_cell(label);
}

function sanitize_segment(
  segment: story_segment,
  previews: insight_preview_map,
): story_segment {
  if (segment.type === "text") {
    return segment;
  }

  const preview = previews.get(segment.insight_id);
  if (!preview) {
    return { type: "text", value: segment.label };
  }

  const row = segment.row;
  const col = segment.col;

  if (
    row < 0 ||
    col < 0 ||
    row >= preview.rows.length ||
    col >= preview.columns.length ||
    !cell_matches_label(preview, row, col, segment.label)
  ) {
    const fallback = preview.rows[row]?.[col];
    if (fallback != null) {
      return { type: "text", value: fallback };
    }
    return { type: "text", value: segment.label };
  }

  return segment;
}

/**
 * @param raw - Parsed LLM story payload
 * @param previews - Insight id → result preview used in the request
 * @returns Sanitized story with invalid cites downgraded to plain text
 */
export function validate_story_response(
  raw: story_response,
  previews: insight_preview_map,
): story_response {
  const title = raw.title?.trim() || "Your report";
  const segments = (raw.segments ?? [])
    .filter((segment): segment is story_segment => {
      if (!segment || typeof segment !== "object") {
        return false;
      }
      if (segment.type === "text") {
        return typeof segment.value === "string";
      }
      if (segment.type === "cite") {
        return (
          typeof segment.insight_id === "string" &&
          typeof segment.label === "string" &&
          typeof segment.row === "number" &&
          typeof segment.col === "number"
        );
      }
      return false;
    })
    .map((segment) => sanitize_segment(segment, previews));

  return { title, segments };
}
