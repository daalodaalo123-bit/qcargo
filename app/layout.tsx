import type { Metadata } from "next";
import "./globals.css";
import { Globe } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DURDUR CARGO | Global Sourcing & Logistics",
  description: "Fast, reliable sea and air cargo sourcing to Somalia and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
