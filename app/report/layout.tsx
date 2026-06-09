/**
 * Report layout — workspace provider for tracked insights and story.
 */

import { ReportWorkspaceProvider } from "@/components/report/report_workspace_provider";

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ReportWorkspaceProvider>{children}</ReportWorkspaceProvider>;
}
