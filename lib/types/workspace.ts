/**
 * Workspace types — CSV snapshot and schema stored in IndexedDB.
 */

import type { workspace_insight } from "@/lib/types/insights";

/** Stored when DuckDB rejects generated SQL — keyed by normalized question. */
export type insight_sql_failure = {
  sql: string;
  error: string;
};

export type csv_encoding = "utf-8" | "latin-1" | "utf-16le" | "utf-16be";

export type workspace_column = {
  name: string;
  type: string;
};

export type workspace_snapshot = {
  file_name: string;
  file_size_bytes: number;
  csv_bytes: ArrayBuffer;
  csv_encoding?: csv_encoding;
  prompt: string;
  row_count: number;
  columns: workspace_column[];
  saved_at: string;
  plan_summary?: string;
  suggested_questions?: string[];
  insights?: workspace_insight[];
  insight_failures?: Record<string, insight_sql_failure>;
};

export type ingest_result = {
  table_name: string;
  file_name: string;
  file_size_bytes: number;
  row_count: number;
  columns: workspace_column[];
  csv_encoding: csv_encoding;
};
