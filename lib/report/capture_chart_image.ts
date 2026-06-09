/**
 * Snapshots Mosaic chart SVGs from the report canvas for PDF embedding.
 */

const MIN_CAPTURE_WIDTH_PX = 480;
const MIN_CAPTURE_HEIGHT_PX = 240;

/**
 * Rasterizes an SVG element to a PNG data URL via an off-screen canvas.
 */
async function svg_element_to_png_data_url(
  svg: SVGSVGElement,
  width: number,
  height: number,
): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const svg_string = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svg_string], { type: "image/svg+xml;charset=utf-8" });
  const svg_url = URL.createObjectURL(blob);

  const image = new Image();
  image.decoding = "async";

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Failed to load chart SVG for export."));
      image.src = svg_url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available for chart export.");
    }

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svg_url);
  }
}

/**
 * Captures chart PNGs for each tracked insight from the live report DOM.
 *
 * @param insight_ids - Tracked insight ids in report order
 * @returns Insight id → PNG data URL (omits ids with no SVG or failed capture)
 */
export async function capture_chart_images(
  insight_ids: string[],
): Promise<Record<string, string>> {
  const images: Record<string, string> = {};

  for (const insight_id of insight_ids) {
    const container = document.querySelector(
      `[data-chart-insight-id="${CSS.escape(insight_id)}"]`,
    );
    const svg = container?.querySelector("svg");

    if (!svg) {
      continue;
    }

    const bounds = svg.getBoundingClientRect();
    const width = Math.max(Math.ceil(bounds.width), MIN_CAPTURE_WIDTH_PX);
    const height = Math.max(Math.ceil(bounds.height), MIN_CAPTURE_HEIGHT_PX);

    try {
      images[insight_id] = await svg_element_to_png_data_url(svg, width, height);
    } catch {
      // PDF layout falls back to a data table for this insight.
    }
  }

  return images;
}
