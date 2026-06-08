/**
 * Discover workspace types — questions, insights, traces, and dataset summary.
 */

export type discover_question_item = {
  id: string;
  text: string;
};

export type discover_quick_insight = {
  id: string;
  fact: string;
  suggested_question: string;
};

export type insight_trace_highlight = {
  row: number;
  col: number;
};

export type insight_trace_table = {
  columns: string[];
  rows: string[][];
  highlight: insight_trace_highlight;
};

export type insight_trace = {
  insight_id: string;
  label: string;
  primary_value: string;
  table: insight_trace_table;
  sql: string;
  last_updated: string;
};

export type dataset_summary = {
  name: string;
  rows: number;
  columns: number;
  file_size_kb: number;
};
