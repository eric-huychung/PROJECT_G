/**
 * Workspace types — CSV snapshot and schema stored in IndexedDB.
 */

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
};

export type ingest_result = {
  table_name: string;
  file_name: string;
  file_size_bytes: number;
  row_count: number;
  columns: workspace_column[];
  csv_encoding: csv_encoding;
};
