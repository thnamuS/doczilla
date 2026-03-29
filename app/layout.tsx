"use client";

import { useEffect } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Doczilla - Document Management Platform",
//   description: "Professional document management and upload platform",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Health check on app load
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (response.ok) {
          console.log("Backend health check passed");
        } else {
          console.warn("Backend health check failed:", response.status);
        }
      } catch (err) {
        console.warn("Backend health check error:", err);
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 animate-fade-in">{children}</main>
      </body>
    </html>
  );
}
