"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Jobs", href: "/dashboard/jobs" },
    { label: "Create job", href: "/dashboard/job-create" }
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        {/* Main header row */}
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between h-16">
          <Link href="/dashboard/jobs" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              U
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-neutral-800 font-semibold text-base tracking-tight">Umurava AI Screening</div>
              <div className="text-[12px] text-neutral-500 font-normal">Explainable, recruiter-led shortlisting</div>
            </div>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-2 sm:gap-6 h-16">
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

          {/* Hamburger — visible only on mobile */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors focus-ring"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-neutral-100 bg-white px-4 pb-4 pt-2 space-y-1 animate-fade-in-up">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard/jobs" && pathname.startsWith(item.href));
              const isCreateJob = item.label === "Create job";

              if (isCreateJob) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block w-full text-center px-5 py-3 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm mt-2"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-primary-500 bg-primary-50"
                      : "text-neutral-600 hover:text-primary-500 hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
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
