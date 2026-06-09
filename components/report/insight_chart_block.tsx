/**
 * Single insight chart block on the report canvas — Mosaic + verify.
 */

"use client";

import { VerifyInsightButton } from "@/components/discover/verify_insight_button";
import { InsightMosaicChart } from "@/components/report/insight_mosaic_chart";
import { MARK_OPTIONS } from "@/lib/mosaic/query_result_to_rows";
import type { chart_spec, workspace_insight } from "@/lib/types/insights";

type insight_chart_block_props = {
  insight: workspace_insight;
  chart_spec: chart_spec;
  chart_number: number;
  chart_total: number;
  on_spec_change: (spec: chart_spec) => void;
  on_verify: () => void;
};

/**
 * @param props - Insight, chart spec, and edit handlers
 */
export function InsightChartBlock({
  insight,
  chart_spec,
  chart_number,
  chart_total,
  on_spec_change,
  on_verify,
}: insight_chart_block_props) {
  const columns = insight.query_result.columns;

  return (
    <article
      className="glass-field rounded-3xl p-6 transition-all print:break-inside-avoid print:shadow-none"
      aria-labelledby={`chart-${insight.id}-title`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-g-gray">
            Chart {chart_number} of {chart_total}
          </p>
          <h3
            id={`chart-${insight.id}-title`}
            className="font-semibold text-g-ink"
          >
            {insight.question}
          </h3>
          <p className="mt-1 text-sm text-g-gray">{insight.narrative}</p>
        </div>
        <div className="print:hidden" onClick={(event) => event.stopPropagation()}>
          <VerifyInsightButton on_verify={on_verify} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <label className="flex flex-col gap-1 text-xs text-g-gray">
          Chart type
          <select
            value={chart_spec.mark}
            onChange={(event) =>
              on_spec_change({ ...chart_spec, mark: event.target.value })
            }
            className="rounded-xl border border-g-fill bg-g-white px-2 py-1.5 text-sm text-g-ink"
          >
            {MARK_OPTIONS.map((mark) => (
              <option key={mark} value={mark}>
                {mark}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-g-gray">
          X axis
          <select
            value={chart_spec.x}
            onChange={(event) =>
              on_spec_change({ ...chart_spec, x: event.target.value })
            }
            className="rounded-xl border border-g-fill bg-g-white px-2 py-1.5 text-sm text-g-ink"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-g-gray">
          Y axis
          <select
            value={chart_spec.y}
            onChange={(event) =>
              on_spec_change({ ...chart_spec, y: event.target.value })
            }
            className="rounded-xl border border-g-fill bg-g-white px-2 py-1.5 text-sm text-g-ink"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
      </div>

      <InsightMosaicChart
        insight_id={insight.id}
        query_result={insight.query_result}
        chart_spec={chart_spec}
      />
    </article>
  );
}
