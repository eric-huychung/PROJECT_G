/**
 * Discover route — dataset exploration after upload.
 */

import { Suspense } from "react";

import { DiscoverPage } from "@/components/discover/discover_page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DiscoverPage />
    </Suspense>
  );
}
