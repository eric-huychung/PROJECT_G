/**
 * Track / untrack control for a single discover question.
 */

"use client";

import { Check, Plus } from "lucide-react";

import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";
import { cn } from "@/lib/utils";

type track_question_button_props = {
  question_id: string;
  disabled?: boolean;
};

/**
 * @param props - Question id and optional disabled state
 */
export function TrackQuestionButton({
  question_id,
  disabled = false,
}: track_question_button_props) {
  const { is_tracked, toggle_track } = use_tracked_questions();
  const tracked = is_tracked(question_id);

  const handle_click = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggle_track(question_id);
  };

  return (
    <button
      type="button"
      disabled={!tracked && disabled}
      onClick={handle_click}
      className={cn(
        "glass-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        tracked
          ? "text-g-red hover:text-g-red-hover"
          : disabled
            ? "cursor-not-allowed opacity-40"
            : "text-g-gray hover:text-g-navy",
      )}
    >
      {tracked ? (
        <>
          <Check className="h-3 w-3" />
          Tracked
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" />
          Track
        </>
      )}
    </button>
  );
}
