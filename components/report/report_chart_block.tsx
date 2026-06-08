/**
 * Single editable chart block on the report canvas.
 */

"use client";

import {
  SvgFyBarChart,
  SvgHorizontalBarChart,
  SvgPieChart,
} from "@/components/report/report_svg_charts";
import type {
  report_fy_spend,
  report_named_total,
  report_resolved_chart,
} from "@/lib/types/report";

type report_chart_block_props = {
  chart: report_resolved_chart;
  chart_number: number;
  chart_total: number;
  on_title_change: (value: string) => void;
  on_subtitle_change: (value: string) => void;
};

/**
 * @param props - Resolved chart, position labels, and edit handlers
 */
export function ReportChartBlock({
  chart,
  chart_number,
  chart_total,
  on_title_change,
  on_subtitle_change,
}: report_chart_block_props) {
  return (
    <article
      className="glass-field rounded-3xl p-6 transition-all print:break-inside-avoid print:shadow-none"
      aria-labelledby={`chart-${chart.id}-title`}
    >
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-g-gray">
          Chart {chart_number} of {chart_total}
        </p>
        <textarea
          id={`chart-${chart.id}-title`}
          value={chart.title}
          onChange={(event) => on_title_change(event.target.value)}
          rows={1}
          className="w-full resize-none bg-transparent font-semibold text-g-ink focus:outline-none print:resize-none"
          aria-label={`Chart ${chart_number} title`}
        />
        <textarea
          value={chart.subtitle}
          onChange={(event) => on_subtitle_change(event.target.value)}
          rows={2}
          className="mt-1 w-full resize-none bg-transparent text-sm text-g-gray focus:outline-none print:resize-none"
          aria-label={`Chart ${chart_number} subtitle`}
        />
      </div>

      <div>
        {chart.kind === "pie" ? (
          <SvgPieChart rows={chart.rows as report_named_total[]} />
        ) : null}

        {chart.kind === "bar" ? (
          <SvgHorizontalBarChart rows={chart.rows as report_named_total[]} />
        ) : null}

        {chart.kind === "fy_bar" ? (
          <SvgFyBarChart rows={chart.rows as report_fy_spend[]} />
        ) : null}
      </div>

      <p className="mt-4 border-t border-g-fill/80 pt-3 text-xs text-g-gray">
        Source: Washington State Vendor Payments FY 2022–2023
      </p>
    </article>
  );
}
