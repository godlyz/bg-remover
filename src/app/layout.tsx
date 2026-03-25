import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BGFree - Free AI Background Remover",
  description: "Remove image backgrounds instantly with AI. Free, fast, and no signup required.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
