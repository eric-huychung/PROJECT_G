/**
 * Client-side report story generation and caching.
 */

import { preview_from_query_result } from "@/lib/insights/build_result_preview";
import { fetch_insight_story } from "@/lib/insights/fetch_insights_api";
import {
  get_tracked_insights,
  story_matches_tracked_insights,
} from "@/lib/insights/tracked_insights";
import { patch_workspace } from "@/lib/storage/workspace_db";
import type { report_story } from "@/lib/types/report";
import type { workspace_snapshot } from "@/lib/types/workspace";

/**
 * @param snapshot - Current workspace
 * @returns Cached story when tracked set matches, otherwise null
 */
export function get_cached_report_story(
  snapshot: workspace_snapshot,
): report_story | null {
  const tracked_ids = snapshot.tracked_insight_ids ?? [];
  if (!story_matches_tracked_insights(tracked_ids, snapshot.report_story)) {
    return null;
  }
  return snapshot.report_story ?? null;
}

/**
 * @param snapshot - Workspace with tracked insights
 * @returns Fresh story from API, persisted on snapshot
 */
export async function generate_report_story(
  snapshot: workspace_snapshot,
): Promise<report_story> {
  const tracked = get_tracked_insights(snapshot);
  if (tracked.length === 0) {
    throw new Error("Select at least one insight on Discover to generate a report.");
  }

  const payload = tracked.map((insight) => ({
    id: insight.id,
    question: insight.question,
    narrative: insight.narrative,
    result_preview: preview_from_query_result(insight.query_result),
  }));

  const response = await fetch_insight_story(snapshot.prompt, payload);
  const report_story: report_story = {
    title: response.title,
    segments: response.segments,
    generated_at: new Date().toISOString(),
    tracked_insight_ids: tracked.map((insight) => insight.id),
  };

  await patch_workspace({ report_story });
  return report_story;
}

/**
 * @param snapshot - Workspace snapshot
 * @param force - Skip cache and call the story API
 */
export async function load_or_generate_report_story(
  snapshot: workspace_snapshot,
  force = false,
): Promise<report_story | null> {
  const tracked = get_tracked_insights(snapshot);
  if (tracked.length === 0) {
    return null;
  }

  if (!force) {
    const cached = get_cached_report_story(snapshot);
    if (cached) {
      return cached;
    }
  }

  return generate_report_story(snapshot);
}
