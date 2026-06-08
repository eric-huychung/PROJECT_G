/**
 * Dataset summary card on Discover — stats and description.
 */

import { FileSpreadsheet } from "lucide-react";

import { format_dataset_stats_line } from "@/lib/discover/format_dataset_stats";
import { DATASET_BLURB } from "@/lib/mock/discover_data";
import type { dataset_summary } from "@/lib/types/discover";

type dataset_summary_card_props = {
  summary: dataset_summary;
};

/**
 * @param props - Dataset summary stats
 */
export function DatasetSummaryCard({ summary }: dataset_summary_card_props) {
  const stats_line = format_dataset_stats_line(summary);

  return (
    <section className="glass-field mb-8 rounded-3xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-g-white/80">
          <FileSpreadsheet className="h-6 w-6 text-g-red" />
        </div>
        <div className="min-w-0">
          <h2 className="mb-1 text-lg font-semibold text-g-ink">
            {summary.name}
          </h2>
          <p className="mb-3 text-sm text-g-gray">{stats_line}</p>
          <p className="max-w-2xl text-sm text-g-gray">{DATASET_BLURB}</p>
        </div>
      </div>
    </section>
  );
}
