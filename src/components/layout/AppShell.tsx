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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
        fixed top-0 left-0 h-full bg-[#2B71F0] z-50 transition-all duration-300 ease-in-out shadow-2xl shadow-blue-500/10
        lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isSidebarCollapsed ? "w-[84px]" : "w-[260px]"}
      `}>
        {/* Logo Area */}
        <div className={`h-[84px] px-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} transition-all`}>
          {!isSidebarCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-500">
              <span className="text-white text-2xl font-extrabold tracking-tighter leading-none">competence.</span>
              <span className="text-white/60 text-[9px] uppercase tracking-[0.2em] mt-1.5 font-bold">AI Screening</span>
            </div>
          )}
          {isSidebarCollapsed && <span className="text-white text-2xl font-black">c.</span>}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden lg:flex h-8 w-8 bg-white/10 rounded-xl items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all ${isSidebarCollapsed ? "rotate-180" : ""}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="mt-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.label : ""}
                className={`
                  flex items-center rounded-xl text-[14px] transition-all duration-200 group relative
                  ${isSidebarCollapsed ? "justify-center p-3.5" : "gap-3 px-4 py-3"}
                  ${active 
                    ? "bg-white text-[#2B71F0] font-bold shadow-lg shadow-black/5" 
                    : "text-white/70 hover:bg-white/8 hover:text-white"}
                `}
              >
                <span className={active ? "text-[#2B71F0]" : "text-white/60 group-hover:text-white transition-colors"}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 my-6">
           <div className="h-px bg-white/10 w-full" />
        </div>

        <div className="px-3">
          <button 
            onClick={() => router.push("/dashboard/job-create")}
            className={`
              w-full flex items-center bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all shadow-inner
              ${isSidebarCollapsed ? "justify-center p-3.5" : "gap-3 px-4 py-3.5"}
            `}
            title={isSidebarCollapsed ? "Create new job" : ""}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">Create new job</span>}
          </button>
        </div>

        {/* User Profile Section */}
        <div className={`absolute bottom-0 left-0 w-full border-t border-white/10 bg-[#2B71F0]/50 backdrop-blur-md transition-all ${isSidebarCollapsed ? "p-3" : "p-5"}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="h-10 w-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-white/10 shadow-inner">
              {displayFirstName[0]}{displayLastName[0]}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                <div className="text-[13.5px] font-bold text-white truncate leading-none mb-1">{displayFirstName} {displayLastName}</div>
                <div className="text-[11px] text-white/50 truncate font-medium">{user?.email}</div>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Sign out"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[260px]"}`}>
        {/* Top Bar */}
        <header className="h-[84px] bg-white border-b border-[#E8EAED] sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className="lg:hidden p-2.5 -ml-2 bg-[#F1F5F9] text-[#5A6474] rounded-xl hover:text-[#0F1621] transition-all"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col">
               <h1 className="text-[20px] font-extrabold text-[#0F1621] tracking-tight">{getPageTitle()}</h1>
               <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9BA5B4] uppercase tracking-wider mt-0.5">
                  <span className="text-[#2B71F0]">Umurava</span>
                  <span>/</span>
                  <span className="opacity-70">{pathname.split('/').pop()?.replace('-', ' ') || 'Home'}</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-10 w-10 flex items-center justify-center text-[#5A6474] bg-[#F1F5F9] rounded-xl hover:text-[#0F1621] hover:bg-[#E2E8F0] transition-all relative">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-[#DC2626] border-2 border-white rounded-full" />
            </button>

            <div className="relative" ref={avatarMenuRef}>
              <div 
                className="h-11 w-11 rounded-2xl bg-[#2B71F0] text-white flex items-center justify-center font-bold text-[14px] cursor-pointer hover:scale-105 shadow-lg shadow-blue-500/20 transition-all"
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              >
                {displayFirstName[0]}{displayLastName[0]}
              </div>

              {isAvatarMenuOpen && (
                <div className="absolute right-0 top-14 w-64 bg-white border border-[#E8EAED] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-5 py-4 border-b border-[#F5F6FA] mb-2">
                    <div className="text-[15px] font-bold text-[#0F1621] truncate">{displayFirstName} {displayLastName}</div>
                    <div className="text-[12px] text-[#9BA5B4] truncate mt-0.5">{user?.email}</div>
                  </div>
                  
                  <Link href="/dashboard/account" className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-semibold text-[#5A6474] hover:bg-[#F8F9FB] hover:text-[#2B71F0] transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile settings
                  </Link>
                  <Link href="/dashboard/account/password" className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-semibold text-[#5A6474] hover:bg-[#F8F9FB] hover:text-[#2B71F0] transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Change password
                  </Link>
                  <Link href="/dashboard/account/sessions" className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-semibold text-[#5A6474] hover:bg-[#F8F9FB] hover:text-[#2B71F0] transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Active sessions
                  </Link>

                  <div className="h-px bg-[#F5F6FA] my-2" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[14px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-all text-left"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 sm:p-10 lg:p-12">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
