/**
 * Report page types — chart data shapes and editable chart specs.
 */

export type report_named_total = {
  name: string;
  total: number;
};

export type report_fy_spend = {
  fy: number;
  total: number;
  payments?: number;
};

export type report_chart_kind = "bar" | "pie" | "fy_bar";

export type report_chart_spec = {
  id: string;
  title: string;
  subtitle: string;
  kind: report_chart_kind;
};

export type report_chart_data_bundle = {
  top_vendors: report_named_total[];
  top_agencies: report_named_total[];
  spend_by_category: report_named_total[];
  spend_by_fy: report_fy_spend[];
};

export type report_resolved_chart = report_chart_spec & {
  rows: report_named_total[] | report_fy_spend[];
};

export type report_content = {
  title: string;
  story: string;
  charts: report_chart_spec[];
};
