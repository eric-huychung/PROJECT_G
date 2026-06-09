/**
 * Mosaic chart mount for a single workspace insight on the report page.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { render_insight_chart } from "@/lib/mosaic/render_insight_chart";
import type { chart_spec, query_result } from "@/lib/types/insights";

type insight_mosaic_chart_props = {
  query_result: query_result;
  chart_spec: chart_spec;
};

/**
 * @param props - Insight query result and chart spec
 */
export function InsightMosaicChart({
  query_result,
  chart_spec,
}: insight_mosaic_chart_props) {
  const container_ref = useRef<HTMLDivElement>(null);
  const [error, set_error] = useState<string | null>(null);

  useEffect(() => {
    const container = container_ref.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    render_insight_chart({ container, result: query_result, spec: chart_spec })
      .catch((caught) => {
        if (!cancelled) {
          set_error(
            caught instanceof Error ? caught.message : "Chart failed to render.",
          );
        }
      })
      .then(() => {
        if (!cancelled) {
          set_error(null);
        }
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [query_result, chart_spec]);

  if (error) {
    return (
      <div className="rounded-2xl border border-g-fill bg-g-white/60 p-4">
        <p className="mb-2 text-sm text-g-red/90">{error}</p>
        <InsightTableFallback query_result={query_result} />
      </div>
    );
  }

  return (
    <div
      ref={container_ref}
      className="report-plot min-h-[280px] w-full overflow-x-auto print:overflow-visible"
      aria-label="Insight chart"
    />
  );
}

type insight_table_fallback_props = {
  query_result: query_result;
};

function InsightTableFallback({ query_result }: insight_table_fallback_props) {
  const preview_rows = query_result.rows.slice(0, 8);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-left text-xs">
        <thead>
          <tr className="border-b border-g-fill text-g-gray">
            {query_result.columns.map((column) => (
              <th key={column} className="px-2 py-1 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview_rows.map((row, row_index) => (
            <tr key={`row-${row_index}`} className="border-b border-g-fill/60">
              {row.map((cell, col_index) => (
                <td key={`cell-${row_index}-${col_index}`} className="px-2 py-1 text-g-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
