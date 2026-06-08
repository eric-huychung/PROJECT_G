/**
 * Verify control for a quick insight — opens the value trace modal.
 */

"use client";

type verify_insight_button_props = {
  on_verify: () => void;
};

/**
 * @param props - Handler to open the insight trace modal
 */
export function VerifyInsightButton({ on_verify }: verify_insight_button_props) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        on_verify();
      }}
      className="glass-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-g-gray hover:text-g-navy"
    >
      Verify
    </button>
  );
}
