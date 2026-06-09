/**
 * Lightweight tracked-question state for Discover card selection.
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

import {
  track_id_from_insight_id,
  track_ids_to_insight_ids,
} from "@/lib/insights/tracked_insights";
import { load_workspace, patch_workspace } from "@/lib/storage/workspace_db";

type tracked_questions_context_value = {
  is_tracked: (id: string) => boolean;
  toggle_track: (id: string) => void;
  tracked_insight_count: number;
  is_hydrated: boolean;
};

const TrackedQuestionsContext =
  createContext<tracked_questions_context_value | null>(null);

async function persist_tracked_ids(track_ids: Set<string>): Promise<void> {
  const tracked_insight_ids = track_ids_to_insight_ids(track_ids);
  await patch_workspace({ tracked_insight_ids, report_story: undefined });
}

/**
 * @param props - Child discover routes
 */
export function TrackedQuestionsProvider({ children }: { children: ReactNode }) {
  const [tracked_ids, set_tracked_ids] = useState<Set<string>>(new Set());
  const [is_hydrated, set_is_hydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    load_workspace()
      .then((snapshot) => {
        if (cancelled || !snapshot?.tracked_insight_ids?.length) {
          return;
        }

        set_tracked_ids(
          new Set(
            snapshot.tracked_insight_ids.map((id) => track_id_from_insight_id(id)),
          ),
        );
      })
      .finally(() => {
        if (!cancelled) {
          set_is_hydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const is_tracked = useCallback(
    (id: string) => tracked_ids.has(id),
    [tracked_ids],
  );

  const toggle_track = useCallback((id: string) => {
    set_tracked_ids((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      persist_tracked_ids(next).catch(() => {
        /* ignore persistence errors in UI toggle */
      });

      return next;
    });
  }, []);

  const tracked_insight_count = useMemo(
    () => track_ids_to_insight_ids(tracked_ids).length,
    [tracked_ids],
  );

  const value = useMemo(
    () => ({
      is_tracked,
      toggle_track,
      tracked_insight_count,
      is_hydrated,
    }),
    [is_tracked, toggle_track, tracked_insight_count, is_hydrated],
  );

  return (
    <TrackedQuestionsContext.Provider value={value}>
      {children}
    </TrackedQuestionsContext.Provider>
  );
}

/**
 * Reads tracked question state; must be used inside TrackedQuestionsProvider.
 */
export function use_tracked_questions(): tracked_questions_context_value {
  /* eslint-disable react-hooks/rules-of-hooks -- snake_case hook name (project convention) */
  const context = useContext(TrackedQuestionsContext);
  /* eslint-enable react-hooks/rules-of-hooks */
  if (!context) {
    throw new Error(
      "use_tracked_questions must be used within TrackedQuestionsProvider",
    );
  }
  return context;
}
