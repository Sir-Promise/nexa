import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexa | Connect. Learn. Discover.",
  description: "Explore a universe of possibilities with Nexa.",
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
