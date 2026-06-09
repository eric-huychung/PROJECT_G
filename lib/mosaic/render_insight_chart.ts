/**
 * Mosaic vgplot render helpers for workspace insight charts.
 */

import type { chart_spec, query_result } from "@/lib/types/insights";
import {
  query_result_to_rows,
  resolve_chart_spec,
  type chart_mark,
} from "@/lib/mosaic/query_result_to_rows";
import { resolve_chart_axis_layout } from "@/lib/mosaic/chart_axis_layout";
import type { chart_axis_layout } from "@/lib/mosaic/chart_axis_layout";

type mosaic_module = typeof import("@uwdata/vgplot");

let mosaic_promise: Promise<mosaic_module> | null = null;

/** Lazy-loads vgplot on first chart render. */
export function get_mosaic(): Promise<mosaic_module> {
  if (!mosaic_promise) {
    mosaic_promise = import("@uwdata/vgplot");
  }
  return mosaic_promise;
}

type render_options = {
  container: HTMLElement;
  result: query_result;
  spec: chart_spec;
};

function build_mark(
  mosaic: mosaic_module,
  mark: chart_mark,
  rows: Record<string, string | number>[],
  x: string,
  y: string,
) {
  const tip = true;
  const plot_rows = mark === "line" ? sort_rows_for_line(rows, x) : rows;

  switch (mark) {
    case "barX":
      return mosaic.barX(plot_rows, { x, y, fill: "#232F3E", tip });
    case "line":
      return mosaic.line(plot_rows, {
        x,
        y,
        stroke: "#232F3E",
        strokeWidth: 2,
        fill: "none",
        tip,
      });
    case "dot":
      return mosaic.dot(plot_rows, { x, y, fill: "#7a0000", r: 4, tip });
    case "barY":
    default:
      return mosaic.barY(plot_rows, { x, y, fill: "#232F3E", tip });
  }
}

/** Line marks need sorted X values to avoid self-crossing paths. */
function sort_rows_for_line(
  rows: Record<string, string | number>[],
  x: string,
): Record<string, string | number>[] {
  return [...rows].sort((left, right) => {
    const a = left[x];
    const b = right[x];
    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }
    return String(a ?? "").localeCompare(String(b ?? ""));
  });
}

/**
 * Renders a Mosaic chart into a DOM container.
 *
 * @param options - Target element, query result, and chart spec
 */
export async function render_insight_chart({
  container,
  result,
  spec,
}: render_options): Promise<void> {
  const mosaic = await get_mosaic();
  container.replaceChildren();

  const rows = query_result_to_rows(result);
  if (rows.length === 0 || result.columns.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-sm text-g-gray";
    empty.textContent = "No chart data available.";
    container.appendChild(empty);
    return;
  }

  const resolved = resolve_chart_spec(result, spec);
  const layout = resolve_chart_axis_layout(
    resolved.mark,
    rows,
    resolved.x,
    resolved.y,
    container.clientWidth,
  );

  const plot_element = mosaic.plot(
    build_mark(mosaic, resolved.mark, rows, resolved.x, resolved.y),
    mosaic.width(layout.plot_width),
    mosaic.height(layout.plot_height),
    mosaic.marginLeft(layout.margin_left),
    mosaic.marginBottom(layout.margin_bottom),
    ...axis_layout_options(mosaic, layout),
  );

  container.appendChild(plot_element);
}

function axis_layout_options(
  mosaic: mosaic_module,
  layout: chart_axis_layout,
): Array<(plot: unknown) => void> {
  const options: Array<(plot: unknown) => void> = [];

  if (layout.x_tick_rotate !== undefined) {
    options.push(mosaic.xTickRotate(layout.x_tick_rotate));
  }
  if (layout.y_tick_rotate !== undefined) {
    options.push(mosaic.yTickRotate(layout.y_tick_rotate));
  }
  if (layout.x_tick_format) {
    options.push(mosaic.xTickFormat(layout.x_tick_format));
  }
  if (layout.y_tick_format) {
    options.push(mosaic.yTickFormat(layout.y_tick_format));
  }
  if (layout.y_tick_spacing !== undefined) {
    options.push(mosaic.yTickSpacing(layout.y_tick_spacing));
  }

  return options;
}
