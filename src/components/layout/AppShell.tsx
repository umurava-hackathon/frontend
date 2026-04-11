"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Jobs", href: "/dashboard/jobs" },
    { label: "Create job", href: "/dashboard/job-create" }
  ];

  // Dynamic page titles
  useEffect(() => {
    let title = "Umurava AI Screening";
    if (pathname.includes("/job-create")) title = "Create job | Umurava AI Screening";
    else if (pathname.includes("/shortlist")) title = "Shortlist | Umurava AI Screening";
    else if (pathname.includes("/compare")) title = "Compare candidates | Umurava AI Screening";
    else if (pathname.includes("/screen")) title = "Trigger screening | Umurava AI Screening";
    else if (pathname.includes("/ingest")) title = "Ingest candidates | Umurava AI Screening";
    else if (pathname.includes("/jobs")) title = "Jobs dashboard | Umurava AI Screening";
    
    document.title = title;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
          <Link href="/dashboard/jobs" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              U
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-neutral-800 font-semibold text-base tracking-tight">Umurava AI Screening</div>
              <div className="text-[12px] text-neutral-500 font-normal">Explainable, recruiter-led shortlisting</div>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-6 h-full">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard/jobs" && pathname.startsWith(item.href));
              const isCreateJob = item.label === "Create job";
              
              if (isCreateJob) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="ml-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative h-16 flex items-center px-1 text-sm font-medium transition-colors ${
                    active 
                      ? "text-primary-500" 
                      : "text-neutral-600 hover:text-primary-500"
                  }`}
                >
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12">
        {children}
      </main>
      
      <footer className="max-w-6xl mx-auto w-full px-4 py-8 border-t border-neutral-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          <div>© 2026 Umurava Tech</div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              AI System Online
            </span>
            <span className="hover:text-neutral-600 cursor-pointer transition-colors font-medium">Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
