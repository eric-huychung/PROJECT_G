/**
 * CSV workspace orchestration — ingest, persist, and rehydrate across DuckDB and IndexedDB.
 */

import type { dataset_summary } from "@/lib/types/discover";

/**
 * Loads a CSV into DuckDB and saves the workspace snapshot to IndexedDB.
 *
 * @param file - CSV from the landing drop zone
 * @param prompt - User question from the prompt bar
 */
export async function upload_csv_workspace(
  file: File,
  prompt: string,
): Promise<void> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { ingest_csv } = await import("@/lib/duckdb/ingest_csv");
  const { save_workspace } = await import("@/lib/storage/workspace_db");

  const ingest = await ingest_csv({
    file_name: file.name,
    bytes,
  });

  await save_workspace({
    file_name: ingest.file_name,
    file_size_bytes: ingest.file_size_bytes,
    csv_bytes: bytes.slice().buffer,
    csv_encoding: ingest.csv_encoding,
    prompt: prompt.trim(),
    row_count: ingest.row_count,
    columns: ingest.columns,
    saved_at: new Date().toISOString(),
  });
}

/**
 * Restores the saved workspace from IndexedDB into DuckDB.
 *
 * @returns Summary for the Discover card, or null when no workspace exists
 */
export async function rehydrate_csv_workspace(): Promise<dataset_summary | null> {
  const { load_workspace } = await import("@/lib/storage/workspace_db");
  const { ingest_csv } = await import("@/lib/duckdb/ingest_csv");
  const { snapshot_to_summary } = await import(
    "@/lib/workspace/to_dataset_summary"
  );

  const snapshot = await load_workspace();
  if (!snapshot) {
    return null;
  }

  await ingest_csv({
    file_name: snapshot.file_name,
    bytes: new Uint8Array(snapshot.csv_bytes),
  });

  return snapshot_to_summary(snapshot);
}
