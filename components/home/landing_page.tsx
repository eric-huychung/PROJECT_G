/**
 * Landing page layout and local state.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GLogo } from "@/components/branding/g_logo";
import { DropZone } from "@/components/home/drop_zone";
import { LandingHeadline, LandingPrompt } from "@/components/home/landing_hero";

export function LandingPage() {
  const router = useRouter();
  const [csv_file, set_csv_file] = useState<File | null>(null);
  const [prompt, set_prompt] = useState("");

  const can_analyze = Boolean(csv_file && prompt.trim());

  const handle_analyze = (event: React.FormEvent) => {
    event.preventDefault();
    if (!can_analyze || !csv_file) {
      return;
    }

    const params = new URLSearchParams({
      file: csv_file.name,
      size: String(Math.round(csv_file.size / 1024)),
    });
    router.push(`/discover?${params.toString()}`);
  };

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-g-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-neutral-200/50 blur-3xl" />
        <div className="absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-neutral-300/40 blur-3xl" />
      </div>

      <header className="relative z-10 w-full shrink-0 bg-g-navy">
        <div className="flex w-full items-center px-6 py-5 sm:px-8 sm:py-6">
          <GLogo />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center px-6 py-14 sm:px-8 sm:py-20">
        <LandingHeadline />

        <div className="mt-12 space-y-6">
          <DropZone file={csv_file} on_file_change={set_csv_file} />
          <LandingPrompt
            prompt={prompt}
            on_prompt_change={set_prompt}
            on_prompt_submit={handle_analyze}
            on_prompt_select={set_prompt}
            can_analyze={can_analyze}
          />
        </div>
      </main>

      <footer className="relative z-10 w-full shrink-0 pb-10 text-center">
        <p className="text-xs text-g-gray">Your data stays on this device</p>
      </footer>
    </div>
  );
}
