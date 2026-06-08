/**
 * Common questions — preset cards plus write-then-add custom questions.
 */

"use client";

import { useState } from "react";
import { Check, HelpCircle, Plus } from "lucide-react";

import { use_tracked_questions } from "@/components/discover/tracked_questions_provider";
import { Input } from "@/components/ui/input";
import { COMMON_QUESTIONS } from "@/lib/mock/discover_data";
import { cn } from "@/lib/utils";

type custom_question = {
  id: string;
  text: string;
};

export function CommonQuestionsSection() {
  const { is_tracked, toggle_track } = use_tracked_questions();
  const [draft, set_draft] = useState("");
  const [custom_questions, set_custom_questions] = useState<custom_question[]>(
    [],
  );

  const can_add = Boolean(draft.trim());
  const total_count = COMMON_QUESTIONS.length + custom_questions.length;

  const handle_add = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    set_custom_questions((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, text: trimmed },
    ]);
    set_draft("");
  };

  return (
    <section className="mb-8">
      <div className="mb-2 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-g-navy" />
        <h2 className="text-lg font-semibold text-g-ink">Common questions</h2>
        <span className="glass-chip rounded-full px-2 py-0.5 text-xs text-g-gray">
          {total_count}
        </span>
      </div>
      <p className="mb-4 text-sm text-g-gray">
        Click a question to select it, or write your own below.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMMON_QUESTIONS.map((question) => (
          <QuestionCard
            key={question.id}
            text={question.text}
            tracked={is_tracked(question.id)}
            on_toggle={() => toggle_track(question.id)}
          />
        ))}

        {custom_questions.map((question) => (
          <QuestionCard
            key={question.id}
            text={question.text}
            tracked={is_tracked(question.id)}
            on_toggle={() => toggle_track(question.id)}
          />
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handle_add();
        }}
        className="relative mt-4 min-w-0"
      >
        <Input
          value={draft}
          onChange={(event) => set_draft(event.target.value)}
          placeholder="Write your own question…"
          className="w-full py-5 pr-16 text-base"
        />
        <button
          type="submit"
          disabled={!can_add}
          className={cn(
            "absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl transition-all",
            can_add
              ? "bg-g-red text-g-white hover:bg-g-red-hover"
              : "cursor-not-allowed bg-neutral-200 text-g-gray",
          )}
          aria-label="Add question"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

type question_card_props = {
  text: string;
  tracked: boolean;
  on_toggle: () => void;
};

function QuestionCard({ text, tracked, on_toggle }: question_card_props) {
  return (
    <article
      onClick={on_toggle}
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
      <p className="pr-8 text-sm leading-relaxed text-g-ink transition-colors duration-200 group-hover:text-g-navy">
        {text}
      </p>
    </article>
  );
}
