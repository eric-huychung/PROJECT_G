/**
 * Quick insights feed — click to select, verify to trace.
 */

"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";

import { ValueTraceModal } from "@/components/discover/value_trace_modal";
import { VerifyInsightButton } from "@/components/discover/verify_insight_button";
import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";
import { get_insight_trace } from "@/lib/mock/discover_insight_traces";
import { QUICK_INSIGHTS } from "@/lib/mock/discover_data";
import type { insight_trace } from "@/lib/types/discover";
import { cn } from "@/lib/utils";

export function QuickInsightsSection() {
  const { is_tracked, toggle_track } = use_tracked_questions();
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
          Click an insight to select it. Verify to see the source table and
          query.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {QUICK_INSIGHTS.map((insight) => {
            const question_id = `insight-${insight.id}`;
            const tracked = is_tracked(question_id);

            return (
              <article
                key={insight.id}
                onClick={() => toggle_track(question_id)}
                className={cn(
                  "glass-field glass-field-interactive group relative cursor-pointer rounded-3xl p-5 transition-all",
                  tracked && "ring-1 ring-g-navy/25",
                )}
              >
                {tracked ? (
                  <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-g-navy text-g-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <p className="mb-3 pr-8 text-sm text-g-ink transition-colors duration-200 group-hover:text-g-navy">
                  {insight.fact}
                </p>
                <p className="line-clamp-2 text-xs text-g-gray transition-colors duration-200 group-hover:text-g-ink/70">
                  → {insight.suggested_question}
                </p>
                <div
                  className="mt-3 flex justify-end border-t border-g-fill/80 pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <VerifyInsightButton on_verify={() => open_trace(insight.id)} />
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
