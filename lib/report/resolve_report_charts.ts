/**
 * Resolves report chart specs with data rows for rendering.
 */

import type {
  report_chart_data_bundle,
  report_chart_spec,
  report_resolved_chart,
} from "@/lib/types/report";

function resolve_chart_rows(
  spec: report_chart_spec,
  data: report_chart_data_bundle,
): report_resolved_chart["rows"] {
  switch (spec.kind) {
    case "pie":
      return data.spend_by_category.slice(0, 6);
    case "bar":
      if (spec.id === "top-vendors") {
        return data.top_vendors.slice(0, 8);
      }
      return data.top_agencies.slice(0, 8);
    case "fy_bar":
      return data.spend_by_fy;
    default:
      return [];
  }
}

/**
 * @param specs - Editable chart metadata from report state
 * @param data - Aggregated chart data bundle
 * @returns Charts with resolved row data for SVG rendering
 */
export function resolve_report_charts(
  specs: report_chart_spec[],
  data: report_chart_data_bundle,
): report_resolved_chart[] {
  return specs.map((spec) => ({
    ...spec,
    rows: resolve_chart_rows(spec, data),
  }));
}
