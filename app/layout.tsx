import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedding OS",
  description: "The operating system for modern weddings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#FAF9F7] text-[#191714]">{children}</body>
    </html>
  );
}
