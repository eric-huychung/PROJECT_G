/**
 * Client-side spacing between LLM fetch calls to reduce gateway 429s.
 */

import { LLM_CALL_GAP_MS } from "@/lib/insights/constants";

let last_llm_fetch_at = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Waits until the minimum gap since the last LLM fetch has elapsed. */
export async function wait_for_llm_slot(): Promise<void> {
  const now = Date.now();
  const elapsed = now - last_llm_fetch_at;
  const wait_ms = LLM_CALL_GAP_MS - elapsed;

  if (wait_ms > 0) {
    await sleep(wait_ms);
  }

  last_llm_fetch_at = Date.now();
}

/**
 * @param ms - Delay duration
 */
export async function sleep_ms(ms: number): Promise<void> {
  await sleep(ms);
}
