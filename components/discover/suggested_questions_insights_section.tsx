/**
 * Suggested questions & insights — one card per question with narrative and trace.
 */

"use client";

import { useMemo, useState } from "react";
import { Check, HelpCircle, Loader2, Plus, RefreshCw } from "lucide-react";

import { use_insights_workspace } from "@/components/discover/insights_workspace_provider";
import { ValueTraceModal } from "@/components/discover/value_trace_modal";
import { VerifyInsightButton } from "@/components/discover/verify_insight_button";
import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";
import { build_insight_trace } from "@/lib/insights/build_insight_trace";
import { failure_key_for_question } from "@/lib/insights/insight_storage_helpers";
import { normalize_question_text } from "@/lib/insights/pipeline_helpers";
import { MAX_INITIAL_INSIGHTS } from "@/lib/insights/constants";
import type { insight_trace } from "@/lib/types/discover";
import type { workspace_insight } from "@/lib/types/insights";
import type { insight_sql_failure } from "@/lib/types/workspace";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type question_insight_item = {
  key: string;
  question: string;
  insight: workspace_insight | null;
};

function build_question_insight_items(
  suggested_questions: string[],
  insights: workspace_insight[],
): question_insight_item[] {
  const insight_by_question = new Map<string, workspace_insight>();

  for (const insight of insights) {
    insight_by_question.set(normalize_question_text(insight.question), insight);
  }

  const items: question_insight_item[] = suggested_questions.map(
    (question, index) => ({
      key: `question-${index}-${normalize_question_text(question)}`,
      question,
      insight: insight_by_question.get(normalize_question_text(question)) ?? null,
    }),
  );

  const seen = new Set(
    suggested_questions.map((question) => normalize_question_text(question)),
  );

  for (const insight of insights) {
    const normalized = normalize_question_text(insight.question);
    if (seen.has(normalized)) {
      continue;
    }
    items.push({
      key: `insight-${insight.id}`,
      question: insight.question,
      insight,
    });
  }

  return items;
}

function shorten_error_message(error: string): string {
  const first_line = error.split("\n")[0]?.trim() ?? error;
  if (first_line.length <= 120) {
    return first_line;
  }
  return `${first_line.slice(0, 117)}…`;
}

export function SuggestedQuestionsInsightsSection() {
  const { is_tracked, toggle_track } = use_tracked_questions();
  const {
    suggested_questions,
    insights,
    insight_failures,
    status,
    pending_insight_count,
    cooldown_seconds,
    is_adding_insight,
    add_question,
    retry_insight,
    retry_pending_insights,
  } = use_insights_workspace();

  const [draft, set_draft] = useState("");
  const [pending_add_question, set_pending_add_question] = useState<string | null>(
    null,
  );
  const [retrying_questions, set_retrying_questions] = useState<Set<string>>(
    () => new Set(),
  );
  const [active_trace, set_active_trace] = useState<insight_trace | null>(null);
  const [is_retrying_all, set_is_retrying_all] = useState(false);

  const is_generating = status === "generating";
  const is_planning =
    is_generating && suggested_questions.length === 0;
  const can_add = Boolean(draft.trim()) && !is_adding_insight;

  const card_items = useMemo(
    () => build_question_insight_items(suggested_questions, insights),
    [suggested_questions, insights],
  );

  const open_trace = (insight_id: string) => {
    const insight = insights.find((item) => item.id === insight_id);
    if (insight) {
      set_active_trace(build_insight_trace(insight));
    }
  };

  const handle_add = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    set_pending_add_question(trimmed);
    const added = await add_question(trimmed);
    if (added) {
      set_draft("");
    }
    set_pending_add_question(null);
  };

  const handle_retry_all = async () => {
    set_is_retrying_all(true);
    try {
      await retry_pending_insights();
    } finally {
      set_is_retrying_all(false);
    }
  };

  const handle_retry_card = async (question: string) => {
    const key = failure_key_for_question(question);
    set_retrying_questions((prev) => new Set(prev).add(key));

    try {
      await retry_insight(question);
    } finally {
      set_retrying_questions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const track_id_for_item = (item: question_insight_item): string =>
    item.insight ? `insight-${item.insight.id}` : item.key;

  const failure_for_question = (question: string): insight_sql_failure | null =>
    insight_failures[failure_key_for_question(question)] ?? null;

  const is_retrying_question = (question: string): boolean =>
    retrying_questions.has(failure_key_for_question(question));

  const show_pending_add =
    pending_add_question &&
    !card_items.some(
      (item) =>
        normalize_question_text(item.question) ===
        normalize_question_text(pending_add_question),
    );

  return (
    <>
      <section className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-g-navy" />
          <h2 className="text-lg font-semibold text-g-ink">
            Suggested questions &amp; insights
          </h2>
          <span className="glass-chip rounded-full px-2 py-0.5 text-xs text-g-gray">
            {insights.length}
            {suggested_questions.length > 0
              ? ` / ${suggested_questions.length}`
              : ""}
          </span>
          {is_generating && insights.length > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-g-gray" />
          ) : null}
        </div>
        <p className="mb-4 text-sm text-g-gray">
          {is_planning
            ? "Generating suggested questions and insights…"
            : "Click a card to track it for your report. Verify to see the source query."}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {is_planning
            ? Array.from({ length: MAX_INITIAL_INSIGHTS }).map((_, index) => (
                <PlanSkeletonCard key={`plan-skeleton-${index}`} />
              ))
            : null}

          {!is_planning
            ? card_items.map((item) => {
                const track_id = track_id_for_item(item);
                const tracked = is_tracked(track_id);
                const failure = failure_for_question(item.question);
                const is_card_retrying = is_retrying_question(item.question);
                const is_loading =
                  !item.insight &&
                  (is_generating ||
                    is_card_retrying ||
                    (is_adding_insight &&
                      pending_add_question &&
                      normalize_question_text(item.question) ===
                        normalize_question_text(pending_add_question)));

                if (is_loading || is_card_retrying) {
                  return (
                    <LoadingInsightCard
                      key={item.key}
                      question={item.question}
                      on_retry={() => void handle_retry_card(item.question)}
                      is_retrying={is_card_retrying}
                      tracked={tracked}
                      on_toggle_track={() => toggle_track(track_id)}
                    />
                  );
                }

                if (!item.insight) {
                  return (
                    <FailedInsightCard
                      key={item.key}
                      question={item.question}
                      failure={failure}
                      tracked={tracked}
                      is_retrying={is_card_retrying}
                      on_toggle={() => toggle_track(track_id)}
                      on_retry={() => void handle_retry_card(item.question)}
                    />
                  );
                }

                return (
                  <InsightCard
                    key={item.key}
                    insight={item.insight}
                    tracked={tracked}
                    is_retrying={is_card_retrying}
                    on_toggle={() => toggle_track(track_id)}
                    on_verify={() => open_trace(item.insight!.id)}
                    on_retry={() => void handle_retry_card(item.question)}
                  />
                );
              })
            : null}

          {show_pending_add ? (
            <LoadingInsightCard
              question={pending_add_question!}
              is_retrying
            />
          ) : null}
        </div>

        {!is_generating && pending_insight_count > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-g-gray">
              {pending_insight_count} insight
              {pending_insight_count === 1 ? "" : "s"} still pending
              {cooldown_seconds > 0
                ? ` — retry in ~${cooldown_seconds}s`
                : " — rate limit paused generation"}.
            </p>
            <button
              type="button"
              onClick={() => void handle_retry_all()}
              disabled={is_retrying_all || cooldown_seconds > 0}
              className="glass-chip rounded-2xl px-4 py-2 text-sm font-medium text-g-navy transition-colors hover:bg-g-fill disabled:opacity-60"
            >
              {is_retrying_all
                ? "Retrying…"
                : cooldown_seconds > 0
                  ? `Wait ${cooldown_seconds}s`
                  : "Retry pending insights"}
            </button>
          </div>
        ) : null}

        {!is_generating &&
        !is_planning &&
        insights.length === 0 &&
        status === "ready" ? (
          <p className="mt-4 text-sm text-g-gray">
            No insights could be generated for this dataset. Try asking your
            own question below.
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handle_add();
          }}
          className="relative mt-6 min-w-0"
        >
          <Input
            value={draft}
            onChange={(event) => set_draft(event.target.value)}
            placeholder="Ask your own question…"
            className="w-full py-5 pr-16 text-base"
            disabled={is_adding_insight || is_planning}
          />
          <button
            type="submit"
            disabled={!can_add || is_planning}
            className={cn(
              "absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl transition-all",
              can_add && !is_planning
                ? "bg-g-red text-g-white hover:bg-g-red-hover"
                : "cursor-not-allowed bg-neutral-200 text-g-gray",
            )}
            aria-label="Add question"
          >
            {is_adding_insight ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </form>
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

type card_top_actions_props = {
  tracked: boolean;
  is_retrying: boolean;
  on_retry: () => void;
};

function CardTopActions({
  tracked,
  is_retrying,
  on_retry,
}: card_top_actions_props) {
  return (
    <div className="absolute right-4 top-4 flex items-center gap-1.5">
      {tracked ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-g-navy text-g-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          on_retry();
        }}
        disabled={is_retrying}
        className="flex h-7 w-7 items-center justify-center rounded-full text-g-gray transition-colors hover:bg-g-fill hover:text-g-navy disabled:opacity-60"
        aria-label="Retry insight"
      >
        {is_retrying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function PlanSkeletonCard() {
  return (
    <div className="glass-field rounded-3xl p-5">
      <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200/80" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-200/80" />
      </div>
      <div className="mt-4 flex justify-end">
        <Loader2 className="h-4 w-4 animate-spin text-g-gray" />
      </div>
    </div>
  );
}

type loading_insight_card_props = {
  question: string;
  is_retrying?: boolean;
  tracked?: boolean;
  on_toggle_track?: () => void;
  on_retry?: () => void;
};

function LoadingInsightCard({
  question,
  is_retrying = true,
  tracked = false,
  on_toggle_track,
  on_retry,
}: loading_insight_card_props) {
  return (
    <article
      onClick={on_toggle_track}
      className={cn(
        "glass-field relative rounded-3xl p-5",
        on_toggle_track && "glass-field-interactive cursor-pointer",
        tracked && "ring-1 ring-g-navy/25",
      )}
    >
      {on_retry ? (
        <CardTopActions
          tracked={tracked}
          is_retrying={is_retrying}
          on_retry={on_retry}
        />
      ) : null}
      <h3 className="mb-3 pr-16 text-sm font-medium leading-snug text-g-ink">
        {question}
      </h3>
      <div className="flex items-center gap-2 text-sm text-g-gray">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>Generating insight…</span>
      </div>
    </article>
  );
}

type failed_insight_card_props = {
  question: string;
  failure: insight_sql_failure | null;
  tracked: boolean;
  is_retrying: boolean;
  on_toggle: () => void;
  on_retry: () => void;
};

function FailedInsightCard({
  question,
  failure,
  tracked,
  is_retrying,
  on_toggle,
  on_retry,
}: failed_insight_card_props) {
  return (
    <article
      onClick={on_toggle}
      className={cn(
        "glass-field glass-field-interactive relative cursor-pointer rounded-3xl p-5 transition-all",
        tracked && "ring-1 ring-g-navy/25",
      )}
    >
      <CardTopActions
        tracked={tracked}
        is_retrying={is_retrying}
        on_retry={on_retry}
      />
      <h3 className="mb-2 pr-16 text-sm font-medium leading-snug text-g-ink">
        {question}
      </h3>
      <p className="text-sm text-g-red/90">
        {failure
          ? shorten_error_message(failure.error)
          : "Insight could not be generated."}
      </p>
      <p className="mt-1 text-xs text-g-gray">Tap refresh to retry this question.</p>
    </article>
  );
}

type insight_card_props = {
  insight: workspace_insight;
  tracked: boolean;
  is_retrying: boolean;
  on_toggle: () => void;
  on_verify: () => void;
  on_retry: () => void;
};

function InsightCard({
  insight,
  tracked,
  is_retrying,
  on_toggle,
  on_verify,
  on_retry,
}: insight_card_props) {
  return (
    <article
      onClick={on_toggle}
      className={cn(
        "glass-field glass-field-interactive group relative cursor-pointer rounded-3xl p-5 transition-all",
        tracked && "ring-1 ring-g-navy/25",
      )}
    >
      <CardTopActions
        tracked={tracked}
        is_retrying={is_retrying}
        on_retry={on_retry}
      />
      <h3 className="mb-3 pr-16 text-sm font-medium leading-snug text-g-ink transition-colors duration-200 group-hover:text-g-navy">
        {insight.question}
      </h3>
      <p className="text-sm leading-relaxed text-g-gray transition-colors duration-200 group-hover:text-g-ink/80">
        {insight.narrative}
      </p>
      <div
        className="mt-3 flex justify-end border-t border-g-fill/80 pt-3"
        onClick={(event) => event.stopPropagation()}
      >
        <VerifyInsightButton on_verify={on_verify} />
      </div>
    </article>
  );
}
