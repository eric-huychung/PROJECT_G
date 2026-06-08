/**
 * Quick insights feed — traceable facts with track actions.
 */

"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

import { TrackQuestionButton } from "@/components/discover/track_question_button";
import { ValueTraceModal } from "@/components/discover/value_trace_modal";
import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";
import { get_insight_trace } from "@/lib/mock/discover_insight_traces";
import { QUICK_INSIGHTS } from "@/lib/mock/discover_data";
import type { insight_trace } from "@/lib/types/discover";
import { cn } from "@/lib/utils";

export function QuickInsightsSection() {
  const { is_tracked } = use_tracked_questions();
  const [active_trace, set_active_trace] = useState<insight_trace | null>(null);

  const open_trace = (insight_id: string) => {
    const trace = get_insight_trace(insight_id);
    if (trace) {
      set_active_trace(trace);
    }
  };

  return (
    <>
      <section className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-g-red" />
          <h2 className="text-lg font-semibold text-g-ink">Quick insights</h2>
          <span className="glass-chip rounded-full px-2 py-0.5 text-xs text-g-gray">
            {QUICK_INSIGHTS.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-g-gray">
          Facts surfaced from your data. Click an insight to trace it back to
          the source table and query.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {QUICK_INSIGHTS.map((insight) => {
            const question_id = `insight-${insight.id}`;
            const tracked = is_tracked(question_id);

            return (
              <article
                key={insight.id}
                onClick={() => open_trace(insight.id)}
                className={cn(
                  "glass-field glass-field-interactive group cursor-pointer rounded-3xl p-5 transition-all",
                  tracked && "ring-1 ring-g-navy/20",
                )}
              >
                <p className="mb-3 text-sm text-g-ink transition-colors duration-200 group-hover:text-g-navy">
                  {insight.fact}
                </p>
                <p className="line-clamp-2 text-xs text-g-gray transition-colors duration-200 group-hover:text-g-ink/70">
                  → {insight.suggested_question}
                </p>
                <div
                  className="mt-3 flex justify-end border-t border-g-fill/80 pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <TrackQuestionButton question_id={question_id} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {active_trace ? (
        <ValueTraceModal
          trace={active_trace}
          on_close={() => set_active_trace(null)}
        />
      ) : null}
    </>
  );
}
