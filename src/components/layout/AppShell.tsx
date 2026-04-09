"use client";

import React from "react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="sticky top-0 z-10 bg-[#F7F8FA] border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1F2A37] text-white flex items-center justify-center font-semibold">
              U
            </div>
            <div className="leading-tight">
              <div className="text-gray-900 font-semibold">Umurava AI Screening</div>
              <div className="text-sm text-gray-600">Explainable, recruiter-led shortlisting</div>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/dashboard/job-create" className="text-gray-700 hover:text-gray-900">
              Create job
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

