/**
 * Lightweight tracked-question state for Discover card selection.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type tracked_questions_context_value = {
  is_tracked: (id: string) => boolean;
  toggle_track: (id: string) => void;
};

const TrackedQuestionsContext =
  createContext<tracked_questions_context_value | null>(null);

/**
 * @param props - Child discover routes
 */
export function TrackedQuestionsProvider({ children }: { children: ReactNode }) {
  const [tracked_ids, set_tracked_ids] = useState<Set<string>>(new Set());

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
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ is_tracked, toggle_track }),
    [is_tracked, toggle_track],
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
