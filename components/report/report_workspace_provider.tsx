/**
 * Report page workspace state — tracked insights, story generation, trace modal.
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

import { ValueTraceModal } from "@/components/discover/value_trace_modal";
import { build_insight_trace } from "@/lib/insights/build_insight_trace";
import {
  get_cached_report_story,
  load_or_generate_report_story,
} from "@/lib/insights/run_report_story";
import { get_tracked_insights } from "@/lib/insights/tracked_insights";
import { to_user_error } from "@/lib/errors/ingest_errors";
import { load_workspace } from "@/lib/storage/workspace_db";
import type { insight_trace } from "@/lib/types/discover";
import type { chart_spec, workspace_insight } from "@/lib/types/insights";
import type { report_story } from "@/lib/types/report";
import type { user_facing_error } from "@/lib/types/user_error";
import type { workspace_snapshot } from "@/lib/types/workspace";

export type report_workspace_status =
  | "loading"
  | "empty"
  | "ready"
  | "generating_story"
  | "error";

type report_workspace_context_value = {
  status: report_workspace_status;
  error: user_facing_error | null;
  story_error: string | null;
  snapshot: workspace_snapshot | null;
  tracked_insights: workspace_insight[];
  story: report_story | null;
  chart_specs: Record<string, chart_spec>;
  set_title: (title: string) => void;
  set_text_segment: (index: number, value: string) => void;
  set_chart_spec: (insight_id: string, spec: chart_spec) => void;
  regenerate_story: () => Promise<void>;
  open_cite_trace: (insight_id: string, row: number, col: number) => void;
  open_insight_trace: (insight_id: string) => void;
};

const ReportWorkspaceContext = createContext<report_workspace_context_value | null>(
  null,
);

function chart_specs_from_insights(
  insights: workspace_insight[],
): Record<string, chart_spec> {
  return Object.fromEntries(
    insights.map((insight) => [insight.id, { ...insight.chart_spec }]),
  );
}

/**
 * @param props - Child report routes
 */
export function ReportWorkspaceProvider({ children }: { children: ReactNode }) {
  const [status, set_status] = useState<report_workspace_status>("loading");
  const [error, set_error] = useState<user_facing_error | null>(null);
  const [story_error, set_story_error] = useState<string | null>(null);
  const [snapshot, set_snapshot] = useState<workspace_snapshot | null>(null);
  const [story, set_story] = useState<report_story | null>(null);
  const [chart_specs, set_chart_specs] = useState<Record<string, chart_spec>>({});
  const [active_trace, set_active_trace] = useState<insight_trace | null>(null);

  const tracked_insights = useMemo(
    () => (snapshot ? get_tracked_insights(snapshot) : []),
    [snapshot],
  );

  const load_story = useCallback(
    async (workspace: workspace_snapshot, force = false) => {
      if (get_tracked_insights(workspace).length === 0) {
        set_story(null);
        set_story_error(null);
        set_status("empty");
        return;
      }

      set_status("generating_story");
      set_story_error(null);

      try {
        const cached = !force ? get_cached_report_story(workspace) : null;
        const next_story =
          cached ?? (await load_or_generate_report_story(workspace, force));

        set_story(next_story);
        set_status("ready");
      } catch (caught) {
        const cached = get_cached_report_story(workspace);
        set_story(cached);
        set_story_error(
          caught instanceof Error ? caught.message : "Story generation failed.",
        );
        set_status("ready");
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const workspace = await load_workspace();
        if (cancelled) {
          return;
        }

        if (!workspace) {
          set_status("empty");
          return;
        }

        set_snapshot(workspace);
        const tracked = get_tracked_insights(workspace);
        set_chart_specs(chart_specs_from_insights(tracked));

        if (tracked.length === 0) {
          set_status("empty");
          return;
        }

        await load_story(workspace);
      } catch (caught) {
        if (!cancelled) {
          set_error(to_user_error(caught, "rehydrate"));
          set_status("error");
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [load_story]);

  const regenerate_story = useCallback(async () => {
    if (!snapshot) {
      return;
    }
    await load_story(snapshot, true);
    const refreshed = await load_workspace();
    if (refreshed) {
      set_snapshot(refreshed);
      set_story(get_cached_report_story(refreshed));
    }
  }, [load_story, snapshot]);

  const set_title = useCallback((title: string) => {
    set_story((prev) => (prev ? { ...prev, title } : prev));
  }, []);

  const set_text_segment = useCallback((index: number, value: string) => {
    set_story((prev) => {
      if (!prev) {
        return prev;
      }

      const segments = prev.segments.map((segment, segment_index) =>
        segment_index === index && segment.type === "text"
          ? { ...segment, value }
          : segment,
      );

      return { ...prev, segments };
    });
  }, []);

  const set_chart_spec = useCallback((insight_id: string, spec: chart_spec) => {
    set_chart_specs((prev) => ({ ...prev, [insight_id]: spec }));
  }, []);

  const open_trace_for_insight = useCallback(
    (insight_id: string, row?: number, col?: number) => {
      const insight = tracked_insights.find((item) => item.id === insight_id);
      if (!insight) {
        return;
      }

      set_active_trace(
        build_insight_trace(
          insight,
          row != null && col != null ? { row, col } : undefined,
        ),
      );
    },
    [tracked_insights],
  );

  const value = useMemo(
    () => ({
      status,
      error,
      story_error,
      snapshot,
      tracked_insights,
      story,
      chart_specs,
      set_title,
      set_text_segment,
      set_chart_spec,
      regenerate_story,
      open_cite_trace: (insight_id: string, row: number, col: number) =>
        open_trace_for_insight(insight_id, row, col),
      open_insight_trace: (insight_id: string) =>
        open_trace_for_insight(insight_id),
    }),
    [
      status,
      error,
      story_error,
      snapshot,
      tracked_insights,
      story,
      chart_specs,
      set_title,
      set_text_segment,
      set_chart_spec,
      regenerate_story,
      open_trace_for_insight,
    ],
  );

  return (
    <ReportWorkspaceContext.Provider value={value}>
      {children}
      {active_trace ? (
        <ValueTraceModal
          trace={active_trace}
          on_close={() => set_active_trace(null)}
        />
      ) : null}
    </ReportWorkspaceContext.Provider>
  );
}

/** Reads report workspace state; must be used inside ReportWorkspaceProvider. */
export function use_report_workspace(): report_workspace_context_value {
  /* eslint-disable react-hooks/rules-of-hooks -- snake_case hook name (project convention) */
  const context = useContext(ReportWorkspaceContext);
  /* eslint-enable react-hooks/rules-of-hooks */
  if (!context) {
    throw new Error(
      "use_report_workspace must be used within ReportWorkspaceProvider",
    );
  }
  return context;
}
