/**
 * PDF layout helpers — per-chart image sizing for single-column export.
 */

/** Max chart image height in PDF points, by insight count. */
export function chart_image_max_height(insight_count: number): number {
  if (insight_count <= 1) {
    return 300;
  }
  if (insight_count === 2) {
    return 260;
  }
  return 240;
}
