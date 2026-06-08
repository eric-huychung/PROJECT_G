/**
 * Insight pipeline types — schema payloads, stored insights, and API shapes.
 */

import type { workspace_column } from "@/lib/types/workspace";

export type dataset_schema = {
  table_name: string;
  columns: workspace_column[];
  row_count: number;
};

export type chart_spec = {
  mark: string;
  x: string;
  y: string;
};

export type query_result = {
  columns: string[];
  rows: string[][];
};

export type result_preview = {
  columns: string[];
  rows: string[][];
  row_count: number;
};

export type workspace_insight = {
  id: string;
  question: string;
  sql: string;
  chart_spec: chart_spec;
  query_result: query_result;
  narrative: string;
  pinned: boolean;
  created_at: string;
};

export type plan_response = {
  summary: string;
  questions: string[];
};

export type query_response = {
  sql: string;
  chart_spec: chart_spec;
};

export type narrate_response = {
  narrative: string;
};

/** Optional context when retrying a failed query — avoids re-running plan. */
export type query_hint = {
  failed_sql: string;
  error: string;
};
