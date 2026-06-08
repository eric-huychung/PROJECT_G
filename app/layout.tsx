/**
 * Root layout and global metadata.
 */

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PROJECT G",
  description: "Drop a CSV, ask a question, get charts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-clip antialiased">
      <body className="min-h-full overflow-x-clip font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
