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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/dashboard/jobs" className="flex items-center gap-3 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#1F2A37] text-white flex items-center justify-center font-bold text-lg shadow-soft transition-transform group-hover:scale-105">
              U
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-gray-900 font-bold tracking-tight">Umurava AI Screening</div>
              <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Recruiter OS</div>
            </div>
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-4">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard/jobs" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    active 
                      ? "text-[#1F2A37] bg-gray-100" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-10">
        {children}
      </main>
      
      <footer className="max-w-5xl mx-auto w-full px-4 py-8 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div>© 2026 Umurava Tech</div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              AI System Online
            </span>
            <span className="hover:text-gray-600 cursor-pointer transition-colors">Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
