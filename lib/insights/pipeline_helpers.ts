/**
 * Insight pipeline helpers — pending questions and completion checks.
 */

import { MAX_INITIAL_INSIGHTS } from "@/lib/insights/constants";
import type { workspace_snapshot } from "@/lib/types/workspace";

/** Normalizes question text for deduping insights. */
export function normalize_question_text(question: string): string {
  return question.trim().toLowerCase().replace(/\?+$/, "");
}

/**
 * Questions from the plan that do not yet have a stored insight.
 *
 * @param snapshot - Workspace from IndexedDB
 */
export function pending_insight_questions(
  snapshot: workspace_snapshot,
): string[] {
  const planned = (snapshot.suggested_questions ?? []).slice(
    0,
    MAX_INITIAL_INSIGHTS,
  );
  const answered = new Set(
    (snapshot.insights ?? []).map((insight) =>
      normalize_question_text(insight.question),
    ),
  );

  return planned.filter(
    (question) => !answered.has(normalize_question_text(question)),
  );
}

/** @param snapshot - Workspace from IndexedDB */
export function is_insight_pipeline_complete(
  snapshot: workspace_snapshot,
): boolean {
  if (!snapshot.plan_summary || !snapshot.suggested_questions?.length) {
    return false;
  }

  return pending_insight_questions(snapshot).length === 0;
}

/** @param snapshot - Workspace from IndexedDB */
export function needs_insight_pipeline(snapshot: workspace_snapshot): boolean {
  return !is_insight_pipeline_complete(snapshot);
}
