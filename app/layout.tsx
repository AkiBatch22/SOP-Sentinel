import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOP Sentinel",
  description: "Deterministic and AI-assisted multilingual SOP safety audits.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 antialiased">{children}</body>
    </html>
  );
}
