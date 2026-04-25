"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Profile", href: "/dashboard/account", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { label: "Password", href: "/dashboard/account/password", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    )},
    { label: "Sessions", href: "/dashboard/account/sessions", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )}
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 bg-white border border-[#E8EAED] rounded-xl py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-[3px] ${
                    active 
                      ? "bg-[#EEF4FF] text-[#2B71F0] border-[#2B71F0] font-semibold" 
                      : "text-[#5A6474] border-transparent font-medium hover:bg-[#F8F9FC] hover:text-[#0F1621]"
                  }`}
                >
                  <span className={active ? "text-[#2B71F0]" : "text-[#9BA5B4]"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="lg:col-span-3 bg-white border border-[#E8EAED] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-[860px]">
          {children}
        </main>
      </div>
    </div>
  );
}
