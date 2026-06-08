/**
 * Inline alert for user-facing errors — no raw engine output.
 */

import { AlertCircle } from "lucide-react";

import type { user_facing_error } from "@/lib/types/user_error";

type user_error_banner_props = {
  error: user_facing_error;
};

export function UserErrorBanner({ error }: user_error_banner_props) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-3xl border border-g-red/15 bg-g-red/[0.04] px-5 py-4"
    >
      <AlertCircle
        className="mt-0.5 h-5 w-5 shrink-0 text-g-red"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-medium text-g-ink">{error.title}</p>
        <p className="mt-1 text-sm text-g-gray">{error.message}</p>
        {error.hint ? (
          <p className="mt-2 text-sm text-g-gray/90">{error.hint}</p>
        ) : null}
      </div>
    </div>
  );
}
