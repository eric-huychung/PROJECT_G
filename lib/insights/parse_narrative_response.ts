/**
 * Plain-text and JSON helpers for LLM responses — narrate tolerates non-JSON models.
 */

import { parse_llm_json } from "@/lib/insights/parse_llm_json";

type narrative_json = {
  narrative?: string;
};

/**
 * Extracts narrative text — JSON first, plain-text fallback for Llama-style outputs.
 *
 * @param raw - Model output
 */
export function parse_narrative_from_llm(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = parse_llm_json<narrative_json>(trimmed);
    const from_json = parsed.narrative?.trim();
    if (from_json) {
      return from_json;
    }
  } catch {
    // Models like Llama often skip JSON — use plain text below.
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let text = lines[0] ?? trimmed;

  text = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const narrative_field = text.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
  if (narrative_field?.[1]) {
    return narrative_field[1].replace(/\\"/g, '"').trim();
  }

  return text.replace(/^["']|["']$/g, "").trim();
}
