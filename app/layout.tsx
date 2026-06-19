import type { Metadata } from "next";
import "./globals.css";
import { Globe } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Q CARGO | Global Sourcing & Logistics",
  description: "Fast, reliable sea and air cargo sourcing to Somalia and beyond.",
  icons: {
    icon: '/qcargo-logo.png',
    apple: '/qcargo-logo.png',
  },
};

import { AuthProvider } from "./AuthProvider";

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
      <body className="antialiased bg-[#0B0F19] selection:bg-[#F15D38]/20 selection:text-[#F15D38]">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
