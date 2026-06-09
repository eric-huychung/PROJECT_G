/**
 * Report summary with cited, verifiable numbers from the story API.
 */

"use client";

import { PencilLine } from "lucide-react";

import type { story_segment } from "@/lib/types/report";

type cited_story_section_props = {
  title: string;
  segments: story_segment[];
  is_generating: boolean;
  story_error: string | null;
  on_title_change: (value: string) => void;
  on_text_segment_change: (index: number, value: string) => void;
  on_cite_click: (insight_id: string, row: number, col: number) => void;
};

/**
 * @param props - Story title, segments, and edit / cite handlers
 */
export function CitedStorySection({
  title,
  segments,
  is_generating,
  story_error,
  on_title_change,
  on_text_segment_change,
  on_cite_click,
}: cited_story_section_props) {
  return (
    <section className="report-story-section relative mb-8 border-l-4 border-g-navy pl-5">
      {is_generating ? (
        <p className="mb-3 text-sm text-g-gray animate-pulse">
          Writing your report story…
        </p>
      ) : null}

      {story_error ? (
        <p className="mb-3 text-sm text-g-red/90">{story_error}</p>
      ) : null}

      <div className="mb-3 flex items-center gap-2 text-xs text-g-gray print:hidden">
        <PencilLine className="h-3.5 w-3.5" />
        <span>Edit title and prose · click numbers to verify</span>
      </div>

      <textarea
        value={title}
        onChange={(event) => on_title_change(event.target.value)}
        rows={1}
        disabled={is_generating}
        className="mb-3 w-full resize-none bg-transparent text-xl font-semibold tracking-tight text-g-ink focus:outline-none sm:text-2xl print:resize-none disabled:opacity-60"
        aria-label="Report title"
      />

      <p className="max-w-3xl text-sm leading-relaxed text-g-gray print:text-g-ink">
        {segments.map((segment, index) => {
          if (segment.type === "text") {
            return (
              <span
                key={`text-${index}`}
                contentEditable={!is_generating}
                suppressContentEditableWarning
                onBlur={(event) =>
                  on_text_segment_change(
                    index,
                    event.currentTarget.textContent ?? "",
                  )
                }
                className="outline-none focus:rounded-sm focus:bg-g-fill/60 print:focus:bg-transparent"
              >
                {segment.value}
              </span>
            );
          }

          return (
            <button
              key={`cite-${index}-${segment.insight_id}`}
              type="button"
              onClick={() =>
                on_cite_click(segment.insight_id, segment.row, segment.col)
              }
              className="cite-value mx-0.5 inline rounded px-0.5 font-medium text-g-navy underline decoration-g-red/50 underline-offset-2 transition-colors hover:bg-g-fill/80 print:no-underline print:font-semibold"
              title="Verify this value"
            >
              {segment.label}
            </button>
          );
        })}
      </p>
    </section>
  );
}
