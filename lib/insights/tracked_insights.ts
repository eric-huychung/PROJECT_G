/**
 * Helpers for tracked insight IDs persisted on the workspace snapshot.
 */

import type { workspace_insight } from "@/lib/types/insights";
import type { report_story } from "@/lib/types/report";
import type { workspace_snapshot } from "@/lib/types/workspace";

const INSIGHT_TRACK_PREFIX = "insight-";

/**
 * @param track_id - Discover card track id (`insight-{uuid}` or question key)
 * @returns Insight id when the card has a completed insight
 */
export function insight_id_from_track_id(track_id: string): string | null {
  if (!track_id.startsWith(INSIGHT_TRACK_PREFIX)) {
    return null;
  }
  return track_id.slice(INSIGHT_TRACK_PREFIX.length);
}

/**
 * @param insight_id - Stored workspace insight id
 */
export function track_id_from_insight_id(insight_id: string): string {
  return `${INSIGHT_TRACK_PREFIX}${insight_id}`;
}

/**
 * @param track_ids - In-memory Discover selection
 */
export function track_ids_to_insight_ids(track_ids: Iterable<string>): string[] {
  const ids: string[] = [];
  for (const track_id of track_ids) {
    const insight_id = insight_id_from_track_id(track_id);
    if (insight_id) {
      ids.push(insight_id);
    }
  }
  return ids;
}

/**
 * @param snapshot - Workspace from IndexedDB
 * @returns Tracked insights in saved order, skipping missing ids
 */
export function get_tracked_insights(
  snapshot: workspace_snapshot,
): workspace_insight[] {
  const insight_ids = snapshot.tracked_insight_ids ?? [];
  const by_id = new Map(
    (snapshot.insights ?? []).map((insight) => [insight.id, insight]),
  );

  return insight_ids
    .map((id) => by_id.get(id))
    .filter((insight): insight is workspace_insight => insight != null);
}

/**
 * @param tracked_insight_ids - Current selection
 * @param story - Cached report story
 */
export function story_matches_tracked_insights(
  tracked_insight_ids: string[],
  story: report_story | undefined,
): boolean {
  if (!story) {
    return false;
  }

  const current = [...tracked_insight_ids].sort().join(",");
  const cached = [...story.tracked_insight_ids].sort().join(",");
  return current === cached && current.length > 0;
}
