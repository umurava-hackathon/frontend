"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkLogout } from "@/store/slices/dashboardSlice";

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.dashboard.auth.user);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { label: "Jobs", href: "/dashboard/jobs", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )},
    { label: "Screenings", href: "/dashboard/screenings", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { label: "Account", href: "/dashboard/account", icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
  ];

  // Close menus on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsAvatarMenuOpen(false);
  }, [pathname]);

  // Handle outside click for avatar menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(thunkLogout() as any);
    dispatch({ type: "dashboard/clearAuth" });
    router.push("/login");
  };

  const getPageTitle = () => {
    if (pathname.includes("/job-create")) return "Create job";
    if (pathname.includes("/shortlist")) return "Shortlist Results";
    if (pathname.includes("/compare")) return "Comparison Mode";
    if (pathname.includes("/screen")) return "Screening Parameters";
    if (pathname.includes("/ingest")) return "Applicant Ingestion";
    if (pathname.includes("/account")) return "Account settings";
    if (pathname.includes("/jobs")) return "Jobs";
    if (pathname === "/dashboard") return "Dashboard";
    return "Umurava AI";
  };

  const displayFirstName = user?.firstName ? toTitleCase(user.firstName) : "";
  const displayLastName = user?.lastName ? toTitleCase(user.lastName) : "";

  return (
    <div className="flex min-h-screen bg-[#F5F6FA] text-[#0F1621] overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[260px] bg-[#2B71F0] z-50 transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Area */}
        <div className="h-[72px] px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-white text-xl font-extrabold tracking-tight leading-none">competence.</span>
            <span className="text-white/60 text-[10px] uppercase tracking-widest mt-1 font-bold">Screening Platform</span>
          </div>
          <button className="h-7 w-7 bg-white/15 rounded-md flex items-center justify-center text-white/80 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 group
                  ${active 
                    ? "bg-white text-[#2B71F0] font-semibold" 
                    : "text-white/75 hover:bg-white/12 hover:text-white"}
                `}
              >
                <span className={active ? "text-[#2B71F0]" : "text-white/65 group-hover:text-white"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mx-3 my-2 border-t border-white/15" />

        <div className="px-3">
          <button 
            onClick={() => router.push("/dashboard/job-create")}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/15 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/25 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Create new job
          </button>
        </div>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-white/15 bg-[#2B71F0]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/25 text-white flex items-center justify-center font-bold text-sm">
              {displayFirstName[0]}{displayLastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{displayFirstName} {displayLastName}</div>
              <div className="text-[11px] text-white/65 truncate leading-tight">{user?.email}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-[#F5F6FA] border-b border-[#E8EAED] sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-[#5A6474] hover:text-[#0F1621] transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-[18px] font-bold text-[#0F1621]">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-[#5A6474] hover:text-[#0F1621] transition-colors relative">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>

            <div className="relative" ref={avatarMenuRef}>
              <div 
                className="h-9 w-9 rounded-full bg-[#2B71F0] text-white flex items-center justify-center font-bold text-[13px] cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              >
                {displayFirstName[0]}{displayLastName[0]}
              </div>

              {isAvatarMenuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-white border border-[#E8EAED] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 border-b border-[#E8EAED] mb-1">
                    <div className="text-[14px] font-bold text-[#0F1621] truncate">{displayFirstName} {displayLastName}</div>
                    <div className="text-[12px] text-[#9BA5B4] truncate">{user?.email}</div>
                  </div>
                  
                  <Link href="/dashboard/account" className="flex items-center gap-3 px-4 py-2 text-[14px] text-[#5A6474] hover:bg-[#F5F6FA] hover:text-[#0F1621] transition-colors">
                    Profile settings
                  </Link>
                  <Link href="/dashboard/account/password" className="flex items-center gap-3 px-4 py-2 text-[14px] text-[#5A6474] hover:bg-[#F5F6FA] hover:text-[#0F1621] transition-colors">
                    Change password
                  </Link>
                  <Link href="/dashboard/account/sessions" className="flex items-center gap-3 px-4 py-2 text-[14px] text-[#5A6474] hover:bg-[#F5F6FA] hover:text-[#0F1621] transition-colors">
                    Active sessions
                  </Link>

                  <div className="h-px bg-[#E8EAED] my-1" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors text-left"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
