/**
 * Report route — editable dashboard generated from Discover.
 */

import { Suspense } from "react";

import { ReportPage } from "@/components/report/report_page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPage />
    </Suspense>
  );
}
