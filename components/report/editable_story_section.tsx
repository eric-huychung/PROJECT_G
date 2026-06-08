/**
 * Editable report summary — title and narrative story at the top of the canvas.
 */

"use client";

import { PencilLine } from "lucide-react";

type editable_story_section_props = {
  title: string;
  story: string;
  on_title_change: (value: string) => void;
  on_story_change: (value: string) => void;
};

/**
 * @param props - Story copy and change handlers
 */
export function EditableStorySection({
  title,
  story,
  on_title_change,
  on_story_change,
}: editable_story_section_props) {
  return (
    <section className="relative mb-8 border-l-4 border-g-navy pl-5">
      <div className="mb-3 flex items-center gap-2 text-xs text-g-gray print:hidden">
        <PencilLine className="h-3.5 w-3.5" />
        <span>Click to edit summary</span>
      </div>

      <textarea
        value={title}
        onChange={(event) => on_title_change(event.target.value)}
        rows={1}
        className="mb-2 w-full resize-none bg-transparent text-xl font-semibold tracking-tight text-g-ink focus:outline-none sm:text-2xl print:resize-none"
        aria-label="Report title"
      />

      <textarea
        value={story}
        onChange={(event) => on_story_change(event.target.value)}
        rows={4}
        className="w-full resize-y bg-transparent text-sm leading-relaxed text-g-gray focus:outline-none print:resize-none"
        aria-label="Report story"
      />
    </section>
  );
}
