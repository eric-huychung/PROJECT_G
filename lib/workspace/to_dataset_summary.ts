/**
 * Maps a persisted workspace snapshot to Discover summary card fields.
 */

import type { dataset_summary } from "@/lib/types/discover";
import type { workspace_snapshot } from "@/lib/types/workspace";

/**
 * @param snapshot - Workspace loaded from IndexedDB
 * @returns Row/column counts and file metadata for the summary card
 */
export function snapshot_to_summary(
  snapshot: workspace_snapshot,
): dataset_summary {
  return {
    name: snapshot.file_name,
    rows: snapshot.row_count,
    columns: snapshot.columns.length,
    file_size_kb: Math.round(snapshot.file_size_bytes / 1024),
  };
}
