/**
 * Discover layout — tracked question selection state.
 */

import { TrackedQuestionsProvider } from "@/components/discover/tracked_questions_provider";

export default function DiscoverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TrackedQuestionsProvider>{children}</TrackedQuestionsProvider>;
}
