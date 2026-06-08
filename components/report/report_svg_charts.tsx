/**
 * Hand-rolled SVG charts for the report page — styled with PROJECT_G palette.
 */

import {
  format_chart_currency,
  truncate_chart_label,
} from "@/lib/report/format_chart_currency";
import type { report_fy_spend, report_named_total } from "@/lib/types/report";

const CHART_NAVY = "#232f3e";
const CHART_NAVY_LIGHT = "#3d4f63";
const PIE_COLORS = [
  "#232f3e",
  "#3d4f63",
  "#5a6b7d",
  "#7a0000",
  "#9a3333",
  "#86868b",
];

type svg_horizontal_bar_chart_props = {
  rows: report_named_total[];
  accent?: string;
};

/**
 * @param props - Named totals and optional bar color
 */
export function SvgHorizontalBarChart({
  rows,
  accent = CHART_NAVY,
}: svg_horizontal_bar_chart_props) {
  if (rows.length === 0) {
    return <p className="text-sm text-g-gray">No data available.</p>;
  }

  const max_total = Math.max(...rows.map((row) => row.total));
  const row_height = 44;
  const row_gap = 6;
  const chart_width = 640;
  const bar_area_width = 420;
  const value_width = 72;
  const bar_x = 0;
  const value_x = chart_width - value_width;
  const chart_height = rows.length * (row_height + row_gap);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chart_width} ${chart_height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Horizontal bar chart"
      >
        {rows.map((row, index) => {
          const y = index * (row_height + row_gap);
          const bar_width =
            max_total > 0 ? (row.total / max_total) * bar_area_width : 0;
          const label = truncate_chart_label(row.name, 42);

          return (
            <g key={row.name}>
              <text x={0} y={y + 12} className="fill-g-gray" fontSize={11}>
                {label}
                <title>{row.name}</title>
              </text>
              <rect
                x={bar_x}
                y={y + 20}
                width={bar_width}
                height={16}
                rx={3}
                fill={accent}
                className="opacity-90 hover:opacity-100"
              >
                <title>{`${row.name}: ${format_chart_currency(row.total)}`}</title>
              </rect>
              <text
                x={value_x}
                y={y + 32}
                className="fill-g-ink"
                fontSize={11}
              >
                {format_chart_currency(row.total)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type svg_pie_chart_props = {
  rows: report_named_total[];
};

/**
 * @param props - Category slices (top N; remainder grouped as Other)
 */
export function SvgPieChart({ rows }: svg_pie_chart_props) {
  if (rows.length === 0) {
    return <p className="text-sm text-g-gray">No data available.</p>;
  }

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const slices = rows.slice(0, 5);
  const other_total = rows
    .slice(5)
    .reduce((sum, row) => sum + row.total, 0);

  const pie_slices = [
    ...slices,
    ...(other_total > 0
      ? [{ name: "Other categories", total: other_total }]
      : []),
  ];

  let start_angle = -Math.PI / 2;
  const cx = 100;
  const cy = 100;
  const radius = 88;

  const paths = pie_slices.map((slice, index) => {
    const fraction = total > 0 ? slice.total / total : 0;
    const sweep = fraction * Math.PI * 2;
    const end_angle = start_angle + sweep;
    const large_arc = sweep > Math.PI ? 1 : 0;

    const x1 = cx + radius * Math.cos(start_angle);
    const y1 = cy + radius * Math.sin(start_angle);
    const x2 = cx + radius * Math.cos(end_angle);
    const y2 = cy + radius * Math.sin(end_angle);

    const path =
      fraction >= 0.999
        ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large_arc} 1 ${x2} ${y2} Z`;

    const color = PIE_COLORS[index % PIE_COLORS.length];
    start_angle = end_angle;

    return { slice, path, color, fraction };
  });

  return (
    <div className="flex flex-col items-start gap-6 md:flex-row">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-48 shrink-0"
        role="img"
        aria-label="Pie chart"
      >
        {paths.map(({ slice, path, color }) => (
          <path
            key={slice.name}
            d={path}
            fill={color}
            className="hover:opacity-90"
          >
            <title>{`${slice.name}: ${format_chart_currency(slice.total)} (${total > 0 ? ((slice.total / total) * 100).toFixed(1) : 0}%)`}</title>
          </path>
        ))}
      </svg>

      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {paths.map(({ slice, color, fraction }) => (
          <li key={slice.name} className="flex items-start gap-2">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-g-ink">
              {truncate_chart_label(slice.name, 36)}
              <span className="ml-1 text-g-gray">
                {(fraction * 100).toFixed(1)}% ·{" "}
                {format_chart_currency(slice.total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type svg_fy_bar_chart_props = {
  rows: report_fy_spend[];
};

/**
 * @param props - Fiscal year totals (vertical bars)
 */
export function SvgFyBarChart({ rows }: svg_fy_bar_chart_props) {
  if (rows.length === 0) {
    return <p className="text-sm text-g-gray">No data available.</p>;
  }

  const max_total = Math.max(...rows.map((row) => row.total));
  const bar_width = 72;
  const gap = 48;
  const chart_width = rows.length * bar_width + (rows.length - 1) * gap + 80;
  const chart_height = 220;

  return (
    <svg
      viewBox={`0 0 ${chart_width} ${chart_height}`}
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Fiscal year bar chart"
    >
      <line
        x1={40}
        y1={180}
        x2={chart_width - 20}
        y2={180}
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {rows.map((row, index) => {
        const bar_height = max_total > 0 ? (row.total / max_total) * 140 : 0;
        const x = 60 + index * (bar_width + gap);
        const y = 180 - bar_height;

        return (
          <g key={row.fy}>
            <rect
              x={x}
              y={y}
              width={bar_width}
              height={bar_height}
              rx={4}
              fill={index === 0 ? CHART_NAVY : CHART_NAVY_LIGHT}
              className="hover:opacity-90"
            >
              <title>{`FY ${row.fy}: ${format_chart_currency(row.total)}`}</title>
            </rect>
            <text
              x={x + bar_width / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-g-ink text-[11px]"
              fontSize={11}
            >
              {format_chart_currency(row.total)}
            </text>
            <text
              x={x + bar_width / 2}
              y={198}
              textAnchor="middle"
              className="fill-g-gray text-[12px]"
              fontSize={12}
            >
              FY {row.fy}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
