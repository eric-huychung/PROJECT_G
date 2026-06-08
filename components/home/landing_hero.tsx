/**
 * Landing headline and prompt input.
 */

import { ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SUGGESTED_PROMPTS } from "@/lib/constants/suggested_prompts";
import { cn } from "@/lib/utils";

export function LandingHeadline() {
  return (
    <div className="text-left">
      <h1 className="text-4xl font-semibold tracking-tight text-g-ink sm:text-5xl">
        Drop data. Get insights. Leave.
      </h1>
      <p className="mt-3 max-w-md text-base text-g-gray">
        Upload a CSV, ask a question — that&apos;s it.
      </p>
    </div>
  );
}

type landing_prompt_props = {
  prompt: string;
  on_prompt_change: (value: string) => void;
  on_prompt_submit: (event: React.FormEvent) => void;
  on_prompt_select: (value: string) => void;
  can_analyze: boolean;
  is_ingesting: boolean;
};

/**
 * @param props - Prompt state and submit handler
 */
export function LandingPrompt({
  prompt,
  on_prompt_change,
  on_prompt_submit,
  on_prompt_select,
  can_analyze,
  is_ingesting,
}: landing_prompt_props) {
  return (
    <div>
      <form onSubmit={on_prompt_submit} className="relative min-w-0">
        <Input
          type="text"
          placeholder="What do you want to know?"
          className="w-full py-6 pr-16 text-lg"
          value={prompt}
          onChange={(event) => on_prompt_change(event.target.value)}
        />
        <button
          type="submit"
          disabled={!can_analyze || is_ingesting}
          className={cn(
            "absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl transition-all",
            can_analyze && !is_ingesting
              ? "bg-g-red text-g-white hover:bg-g-red-hover"
              : "cursor-not-allowed bg-neutral-200 text-g-gray",
          )}
          aria-label={is_ingesting ? "Loading dataset" : "Analyze"}
        >
          <ArrowRight
            className={cn("h-5 w-5", is_ingesting && "animate-pulse")}
          />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => on_prompt_select(label)}
            className="glass-chip rounded-full px-4 py-1.5 text-sm text-g-ink/80 hover:text-g-navy"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
