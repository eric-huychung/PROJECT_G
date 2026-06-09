/**
 * Heuristics for Mosaic chart margins and axis ticks on crowded report charts.
 */

import type { chart_mark } from "@/lib/mosaic/query_result_to_rows";

export type chart_axis_layout = {
  margin_left: number;
  margin_bottom: number;
  plot_width: number;
  plot_height: number;
  x_tick_rotate?: number;
  y_tick_rotate?: number;
  x_tick_format?: (value: unknown) => string;
  y_tick_format?: (value: unknown) => string;
  y_tick_spacing?: number;
};

type axis_key = "x" | "y";

const BASE_PLOT_WIDTH = 640;
const BASE_PLOT_HEIGHT = 280;

/**
 * @param mark - Chart mark type
 * @param rows - Plot data rows
 * @param x_key - X channel column
 * @param y_key - Y channel column
 * @param container_width - Available chart container width in pixels
 */
export function resolve_chart_axis_layout(
  mark: chart_mark,
  rows: Record<string, string | number>[],
  x_key: string,
  y_key: string,
  container_width: number,
): chart_axis_layout {
  const x_values = unique_axis_values(rows, x_key);
  const y_values = unique_axis_values(rows, y_key);

  const layout: chart_axis_layout = {
    margin_left: 60,
    margin_bottom: 48,
    plot_width: Math.max(320, container_width || BASE_PLOT_WIDTH),
    plot_height: BASE_PLOT_HEIGHT,
  };

  apply_categorical_axis_layout(layout, "x", x_values, mark !== "barX");
  apply_categorical_axis_layout(layout, "y", y_values, mark === "barX");
  apply_numeric_y_axis_layout(layout, y_values, mark !== "barX");

  if (mark === "barY" && is_mostly_categorical(x_values)) {
    const rotate = layout.x_tick_rotate ?? 0;
    const per_category = rotate === -90 ? 28 : rotate === -45 ? 52 : 72;
    layout.plot_width = Math.max(layout.plot_width, x_values.length * per_category);
  }

  if (mark === "barX" && is_mostly_categorical(y_values)) {
    const rotate = layout.y_tick_rotate ?? 0;
    const per_category = rotate === -90 ? 22 : rotate === -45 ? 36 : 44;
    layout.plot_height = Math.max(BASE_PLOT_HEIGHT, y_values.length * per_category);
  }

  return layout;
}

function apply_categorical_axis_layout(
  layout: chart_axis_layout,
  axis: axis_key,
  values: unknown[],
  is_category_axis: boolean,
): void {
  if (!is_category_axis || !is_mostly_categorical(values)) {
    return;
  }

  const count = values.length;
  const max_label_len = longest_label_length(values);
  const rotate = count > 10 || max_label_len > 14 ? -90 : count > 6 || max_label_len > 10 ? -45 : 0;
  const format =
    max_label_len > 28
      ? (value: unknown) => truncate_label(value, rotate === -90 ? 20 : 26)
      : undefined;

  if (axis === "x") {
    layout.x_tick_rotate = rotate;
    layout.x_tick_format = format;
    layout.margin_bottom =
      rotate === -90
        ? Math.max(100, Math.min(150, max_label_len * 6 + 28))
        : rotate === -45
          ? 76
          : count > 8
            ? 56
            : 48;
    return;
  }

  layout.y_tick_rotate = rotate;
  layout.y_tick_format = format;
  layout.margin_left =
    rotate === -90
      ? Math.max(112, Math.min(180, max_label_len * 6 + 32))
      : rotate === -45
        ? 92
        : Math.max(60, max_label_len * 6 + 24);
}

function apply_numeric_y_axis_layout(
  layout: chart_axis_layout,
  values: unknown[],
  is_value_axis: boolean,
): void {
  if (!is_value_axis || is_mostly_categorical(values)) {
    return;
  }

  const max_abs = max_absolute_value(values);
  const format = (value: unknown) => compact_number_label(value);

  layout.y_tick_format = format;
  layout.margin_left = Math.max(layout.margin_left, max_abs >= 1_000_000 ? 72 : 64);

  // Only thin numeric ticks when the value axis is very dense.
  if (values.length > 30) {
    layout.y_tick_spacing = max_abs >= 1_000_000 ? 52 : max_abs >= 100_000 ? 46 : 40;
  }
}

function unique_axis_values(
  rows: Record<string, string | number>[],
  key: string,
): unknown[] {
  const seen = new Set<string>();
  const values: unknown[] = [];

  for (const row of rows) {
    const value = row[key];
    const token = String(value ?? "");
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    values.push(value);
  }

  return values;
}

function is_mostly_categorical(values: unknown[]): boolean {
  const non_empty = values.filter(
    (value) => value !== null && value !== undefined && String(value).length > 0,
  );
  if (non_empty.length === 0) {
    return false;
  }

  const string_count = non_empty.filter((value) => typeof value === "string").length;
  return string_count / non_empty.length >= 0.5;
}

function longest_label_length(values: unknown[]): number {
  return values.reduce<number>((max, value) => Math.max(max, String(value ?? "").length), 0);
}

function truncate_label(value: unknown, max_length: number): string {
  const text = String(value ?? "");
  if (text.length <= max_length) {
    return text;
  }

  return `${text.slice(0, Math.max(1, max_length - 1))}…`;
}

function compact_number_label(value: unknown): string {
  const number_value =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value ?? "").replace(/,/g, ""));

  if (Number.isNaN(number_value)) {
    return String(value ?? "");
  }

  const abs = Math.abs(number_value);
  const sign = number_value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${trim_trailing_zero(abs / 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${trim_trailing_zero(abs / 1_000_000)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}${trim_trailing_zero(abs / 1_000)}K`;
  }
  if (abs >= 1_000) {
    return number_value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (Number.isInteger(number_value)) {
    return String(number_value);
  }

  return number_value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function trim_trailing_zero(value: number): string {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}

function max_absolute_value(values: unknown[]): number {
  return values.reduce<number>((max, value) => {
    const number_value =
      typeof value === "number"
        ? value
        : Number.parseFloat(String(value ?? "").replace(/,/g, ""));
    if (Number.isNaN(number_value)) {
      return max;
    }
    return Math.max(max, Math.abs(number_value));
  }, 0);
}
