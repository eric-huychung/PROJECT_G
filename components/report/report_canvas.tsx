/**
 * Report dashboard canvas — editable story and chart blocks.
 */

"use client";

import { useMemo, useState } from "react";

import { EditableStorySection } from "@/components/report/editable_story_section";
import { ReportChartBlock } from "@/components/report/report_chart_block";
import {
  DEFAULT_REPORT_CONTENT,
  REPORT_CHART_DATA,
} from "@/lib/mock/report_data";
import { resolve_report_charts } from "@/lib/report/resolve_report_charts";
import type { report_chart_spec } from "@/lib/types/report";

type report_canvas_props = {
  dataset_name: string;
};

/**
 * @param props - Dataset name shown in the report footer metadata
 */
export function ReportCanvas({ dataset_name }: report_canvas_props) {
  const [title, set_title] = useState(DEFAULT_REPORT_CONTENT.title);
  const [story, set_story] = useState(DEFAULT_REPORT_CONTENT.story);
  const [chart_specs, set_chart_specs] = useState<report_chart_spec[]>(
    DEFAULT_REPORT_CONTENT.charts,
  );

  const resolved_charts = useMemo(
    () => resolve_report_charts(chart_specs, REPORT_CHART_DATA),
    [chart_specs],
  );

  const update_chart_field = (
    chart_id: string,
    field: "title" | "subtitle",
    value: string,
  ) => {
    set_chart_specs((prev) =>
      prev.map((chart) =>
        chart.id === chart_id ? { ...chart, [field]: value } : chart,
      ),
    );
  };

  return (
    <div id="report-canvas" className="glass-field rounded-3xl p-6 sm:p-8">
      <EditableStorySection
        title={title}
        story={story}
        on_title_change={set_title}
        on_story_change={set_story}
      />

      <div className="space-y-6">
        {resolved_charts.map((chart, index) => (
          <ReportChartBlock
            key={chart.id}
            chart={chart}
            chart_number={index + 1}
            chart_total={resolved_charts.length}
            on_title_change={(value) =>
              update_chart_field(chart.id, "title", value)
            }
            on_subtitle_change={(value) =>
              update_chart_field(chart.id, "subtitle", value)
            }
          />
        ))}
      </div>

      <p className="mt-8 border-t border-g-fill/80 pt-4 text-xs text-g-gray">
        Generated from{" "}
        <span className="font-medium text-g-ink">{dataset_name}</span>
      </p>
    </div>
  );
}
