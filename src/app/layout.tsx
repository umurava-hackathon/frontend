import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { StoreProvider } from "../store/StoreProvider";
import { Plus_Jakarta_Sans } from 'next/font/google'
import RootWrapper from "./RootWrapper";

const font = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
})

export const metadata: Metadata = {
  title: "Umurava AI Recruiter Screening",
  description: "Explainable AI screening tool for recruiters",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232B71F0%22/><text y=%22.9em%22 x=%22.15em%22 font-size=%2270%22 font-weight=%22bold%22 fill=%22white%22 font-family=%22sans-serif%22>U</text></svg>" />
      </head>
      <body className={`${font.className} antialiased selection:bg-primary-100 bg-[#F5F6FA] text-[#0F1621]`}>
        <StoreProvider>
          <RootWrapper>{children}</RootWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
