/**
 * Discover page header.
 */

import { Compass } from "lucide-react";

type discover_header_props = {
  dataset_name: string;
};

/**
 * @param props - Dataset name shown in the subtitle
 */
export function DiscoverHeader({ dataset_name }: discover_header_props) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-g-navy">
        <Compass className="h-5 w-5 text-g-white" />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-g-ink sm:text-2xl">
          Discover your data
        </h1>
        <p className="truncate text-sm text-g-gray">
          Explore{" "}
          <span className="font-medium text-g-ink">{dataset_name}</span>
        </p>
      </div>
    </div>
  );
}
