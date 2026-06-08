/**
 * Discover insight state — pipeline orchestration and rehydrate from IndexedDB.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { to_user_error } from "@/lib/errors/ingest_errors";
import {
  add_insight_for_question,
  retry_insight_for_question,
  run_insight_pipeline,
} from "@/lib/insights/run_insight_pipeline";
import {
  failure_key_for_question,
  upsert_workspace_insight,
} from "@/lib/insights/insight_storage_helpers";
import { insight_rate_limit_error } from "@/lib/insights/insight_errors";
import {
  needs_insight_pipeline,
  pending_insight_questions,
} from "@/lib/insights/pipeline_helpers";
import {
  format_cooldown_message,
  get_llm_cooldown_remaining_ms,
  is_in_llm_cooldown,
} from "@/lib/insights/llm_cooldown";
import { load_workspace } from "@/lib/storage/workspace_db";
import type { dataset_summary } from "@/lib/types/discover";
import type { workspace_insight } from "@/lib/types/insights";
import type { insight_sql_failure } from "@/lib/types/workspace";
import type { user_facing_error } from "@/lib/types/user_error";

type insights_workspace_status =
  | "loading"
  | "empty"
  | "error"
  | "generating"
  | "ready";

type insights_workspace_context_value = {
  status: insights_workspace_status;
  error: user_facing_error | null;
  summary: dataset_summary | null;
  plan_summary: string | null;
  suggested_questions: string[];
  insights: workspace_insight[];
  insight_failures: Record<string, insight_sql_failure>;
  pending_insight_count: number;
  cooldown_seconds: number;
  is_adding_insight: boolean;
  add_question: (question: string) => Promise<boolean>;
  retry_insight: (question: string) => Promise<boolean>;
  retry_pending_insights: () => Promise<void>;
};

const InsightsWorkspaceContext =
  createContext<insights_workspace_context_value | null>(null);

type pipeline_callbacks = {
  on_plan: (summary: string, questions: string[]) => void;
  on_insight: (insight: workspace_insight) => void;
};

function make_pipeline_callbacks(
  cancelled: () => boolean,
  handlers: {
    set_plan_summary: (value: string) => void;
    set_suggested_questions: (value: string[]) => void;
    set_insights: React.Dispatch<React.SetStateAction<workspace_insight[]>>;
  },
): pipeline_callbacks {
  return {
    on_plan: (next_summary, questions) => {
      if (!cancelled()) {
        handlers.set_plan_summary(next_summary);
        handlers.set_suggested_questions(questions);
      }
    },
    on_insight: (insight) => {
      if (!cancelled()) {
        handlers.set_insights((prev) => {
          if (prev.some((item) => item.id === insight.id)) {
            return prev;
          }
          return [...prev, insight];
        });
      }
    },
  };
}

/**
 * @param props - Child discover routes
 */
export function InsightsWorkspaceProvider({ children }: { children: ReactNode }) {
  const [status, set_status] = useState<insights_workspace_status>("loading");
  const [error, set_error] = useState<user_facing_error | null>(null);
  const [summary, set_summary] = useState<dataset_summary | null>(null);
  const [plan_summary, set_plan_summary] = useState<string | null>(null);
  const [suggested_questions, set_suggested_questions] = useState<string[]>([]);
  const [insights, set_insights] = useState<workspace_insight[]>([]);
  const [insight_failures, set_insight_failures] = useState<
    Record<string, insight_sql_failure>
  >({});
  const [pending_insight_count, set_pending_insight_count] = useState(0);
  const [cooldown_seconds, set_cooldown_seconds] = useState(0);
  const [is_adding_insight, set_is_adding_insight] = useState(false);

  useEffect(() => {
    const tick = () => {
      const remaining = get_llm_cooldown_remaining_ms();
      set_cooldown_seconds(Math.ceil(remaining / 1000));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [status, error, pending_insight_count]);

  const sync_pending_count = useCallback(async () => {
    const snapshot = await load_workspace();
    if (!snapshot) {
      set_pending_insight_count(0);
      return;
    }
    set_pending_insight_count(pending_insight_questions(snapshot).length);
  }, []);

  const run_pipeline = useCallback(
    async (cancelled: () => boolean) => {
      if (is_in_llm_cooldown()) {
        set_error(
          to_user_error(
            new insight_rate_limit_error(
              format_cooldown_message(get_llm_cooldown_remaining_ms()),
            ),
            "rehydrate",
          ),
        );
        await sync_pending_count();
        set_status("ready");
        return;
      }

      const snapshot = await load_workspace();
      if (!snapshot || cancelled()) {
        return;
      }

      set_status("generating");
      set_error(null);

      const callbacks = make_pipeline_callbacks(cancelled, {
        set_plan_summary,
        set_suggested_questions,
        set_insights,
      });

      try {
        await run_insight_pipeline(snapshot, callbacks);
        if (!cancelled()) {
          set_status("ready");
          set_pending_insight_count(0);
          const updated = await load_workspace();
          if (updated?.insight_failures) {
            set_insight_failures(updated.insight_failures);
          } else {
            set_insight_failures({});
          }
        }
      } catch (caught) {
        if (cancelled()) {
          return;
        }

        set_error(to_user_error(caught, "rehydrate"));
        await sync_pending_count();
        const updated = await load_workspace().catch(() => null);
        if (updated?.insight_failures) {
          set_insight_failures(updated.insight_failures);
        }
        set_status("ready");
      }
    },
    [sync_pending_count],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { rehydrate_csv_workspace } = await import(
          "@/lib/workspace/csv_workspace"
        );
        const dataset_summary = await rehydrate_csv_workspace();

        if (cancelled) {
          return;
        }

        if (!dataset_summary) {
          set_status("empty");
          return;
        }

        set_summary(dataset_summary);

        const snapshot = await load_workspace();
        if (!snapshot || cancelled) {
          set_status("empty");
          return;
        }

        if (snapshot.plan_summary) {
          set_plan_summary(snapshot.plan_summary);
        }
        if (snapshot.suggested_questions) {
          set_suggested_questions(snapshot.suggested_questions);
        }
        if (snapshot.insights?.length) {
          set_insights(snapshot.insights);
        }
        if (snapshot.insight_failures) {
          set_insight_failures(snapshot.insight_failures);
        }

        set_pending_insight_count(pending_insight_questions(snapshot).length);

        if (!needs_insight_pipeline(snapshot)) {
          set_status("ready");
          return;
        }

        await run_pipeline(() => cancelled);
      } catch (caught) {
        if (!cancelled) {
          set_error(to_user_error(caught, "rehydrate"));
          await sync_pending_count();
          const snapshot = await load_workspace().catch(() => null);
          set_status(
            snapshot?.insights?.length || snapshot?.plan_summary
              ? "ready"
              : "error",
          );
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [run_pipeline, sync_pending_count]);

  const retry_pending_insights = useCallback(async () => {
    await run_pipeline(() => false);
  }, [run_pipeline]);

  const add_question = useCallback(async (question: string): Promise<boolean> => {
    const trimmed = question.trim();
    if (!trimmed || is_adding_insight) {
      return false;
    }

    set_is_adding_insight(true);
    set_error(null);

    try {
      const snapshot = await load_workspace();
      if (!snapshot) {
        return false;
      }

      const insight = await add_insight_for_question(snapshot, trimmed);
      if (!insight) {
        return false;
      }

      set_insights((prev) => upsert_workspace_insight(prev, insight));
      set_insight_failures((prev) => {
        const next = { ...prev };
        delete next[failure_key_for_question(trimmed)];
        return next;
      });
      set_suggested_questions((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      return true;
    } catch (caught) {
      set_error(to_user_error(caught, "rehydrate"));
      const updated = await load_workspace().catch(() => null);
      if (updated?.insight_failures) {
        set_insight_failures(updated.insight_failures);
      }
      return false;
    } finally {
      set_is_adding_insight(false);
    }
  }, [is_adding_insight]);

  const retry_insight = useCallback(async (question: string): Promise<boolean> => {
    const trimmed = question.trim();
    if (!trimmed) {
      return false;
    }

    set_error(null);

    try {
      const snapshot = await load_workspace();
      if (!snapshot) {
        return false;
      }

      const insight = await retry_insight_for_question(snapshot, trimmed);
      if (!insight) {
        const updated = await load_workspace().catch(() => null);
        if (updated?.insight_failures) {
          set_insight_failures(updated.insight_failures);
        }
        return false;
      }

      set_insights((prev) => upsert_workspace_insight(prev, insight));
      set_insight_failures((prev) => {
        const next = { ...prev };
        delete next[failure_key_for_question(trimmed)];
        return next;
      });
      await sync_pending_count();
      return true;
    } catch (caught) {
      set_error(to_user_error(caught, "rehydrate"));
      return false;
    }
  }, [sync_pending_count]);

  const value = useMemo(
    () => ({
      status,
      error,
      summary,
      plan_summary,
      suggested_questions,
      insights,
      insight_failures,
      pending_insight_count,
      cooldown_seconds,
      is_adding_insight,
      add_question,
      retry_insight,
      retry_pending_insights,
    }),
    [
      status,
      error,
      summary,
      plan_summary,
      suggested_questions,
      insights,
      insight_failures,
      pending_insight_count,
      cooldown_seconds,
      is_adding_insight,
      add_question,
      retry_insight,
      retry_pending_insights,
    ],
  );

  return (
    <InsightsWorkspaceContext.Provider value={value}>
      {children}
    </InsightsWorkspaceContext.Provider>
  );
}

/**
 * Reads insight workspace state; must be used inside InsightsWorkspaceProvider.
 */
export function use_insights_workspace(): insights_workspace_context_value {
  /* eslint-disable react-hooks/rules-of-hooks -- snake_case hook name (project convention) */
  const context = useContext(InsightsWorkspaceContext);
  /* eslint-enable react-hooks/rules-of-hooks */
  if (!context) {
    throw new Error(
      "use_insights_workspace must be used within InsightsWorkspaceProvider",
    );
  }
  return context;
}
