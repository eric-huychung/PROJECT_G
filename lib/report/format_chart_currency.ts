/**
 * Currency and label formatters for report SVG charts.
 */

/**
 * @param value - Dollar amount
 * @returns Compact label (e.g. $9.8B, $450M)
 */
export function format_chart_currency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }

  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/**
 * @param name - Long vendor or agency name
 * @param max_length - Character cap before ellipsis
 * @returns Truncated label for chart axes
 */
export function truncate_chart_label(name: string, max_length = 28): string {
  if (name.length <= max_length) {
    return name;
  }

  return `${name.slice(0, max_length - 1)}…`;
}
