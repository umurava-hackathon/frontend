import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { StoreProvider } from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "Umurava AI Recruiter Screening",
  description: "Explainable AI screening tool for recruiters"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

