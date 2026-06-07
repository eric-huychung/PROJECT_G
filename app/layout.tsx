/**
 * Root layout — minimal shell until UI is built.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJECT_G",
  description: "Disposable intelligence workspace for BizOps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
