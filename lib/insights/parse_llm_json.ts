/**
 * Extracts JSON objects from LLM text responses (handles fenced code blocks).
 */

/**
 * @param raw - Model output that should contain a JSON object
 * @returns Parsed object
 */
export function parse_llm_json<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model response did not contain valid JSON.");
    }
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  }
}
