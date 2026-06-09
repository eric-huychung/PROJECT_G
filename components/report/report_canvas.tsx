/**
 * Report dashboard canvas — cited story and Mosaic insight charts.
 */

"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { CitedStorySection } from "@/components/report/cited_story_section";
import { InsightChartBlock } from "@/components/report/insight_chart_block";
import { use_report_workspace } from "@/components/report/report_workspace_provider";

type report_canvas_props = {
  dataset_name: string;
};

/**
 * @param props - Dataset name shown in the report footer metadata
 */
export function ReportCanvas({ dataset_name }: report_canvas_props) {
  const {
    status,
    story,
    story_error,
    tracked_insights,
    chart_specs,
    set_title,
    set_text_segment,
    set_chart_spec,
    regenerate_story,
    open_cite_trace,
    open_insight_trace,
  } = use_report_workspace();

  const is_generating_story = status === "generating_story";
  const generated_label = story?.generated_at
    ? new Date(story.generated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div id="report-canvas" className="report-canvas glass-field rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-end gap-2 print:hidden">
        <button
          type="button"
          onClick={() => regenerate_story()}
          disabled={is_generating_story || tracked_insights.length === 0}
          className="glass-chip inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs text-g-gray transition-colors hover:text-g-navy disabled:opacity-50"
        >
          {is_generating_story ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Regenerate story
        </button>
      </div>

      {story ? (
        <CitedStorySection
          title={story.title}
          segments={story.segments}
          is_generating={is_generating_story}
          story_error={story_error}
          on_title_change={set_title}
          on_text_segment_change={set_text_segment}
          on_cite_click={open_cite_trace}
        />
      ) : is_generating_story ? (
        <CitedStorySection
          title="Your report"
          segments={[{ type: "text", value: "" }]}
          is_generating
          story_error={story_error}
          on_title_change={() => {}}
          on_text_segment_change={() => {}}
          on_cite_click={() => {}}
        />
      ) : null}

      <div className="space-y-6">
        {tracked_insights.map((insight, index) => {
          const spec = chart_specs[insight.id] ?? insight.chart_spec;
          return (
            <div
              key={insight.id}
              className="report-chart-enter"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <InsightChartBlock
                insight={insight}
                chart_spec={spec}
                chart_number={index + 1}
                chart_total={tracked_insights.length}
                on_spec_change={(next_spec) =>
                  set_chart_spec(insight.id, next_spec)
                }
                on_verify={() => open_insight_trace(insight.id)}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-8 border-t border-g-fill/80 pt-4 text-xs text-g-gray">
        Generated from{" "}
        <span className="font-medium text-g-ink">{dataset_name}</span>
        {generated_label ? ` · ${generated_label}` : null}
      </p>
    </div>
  );
}
