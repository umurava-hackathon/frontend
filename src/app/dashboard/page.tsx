"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  thunkFetchDashboardStats, 
  thunkFetchRecentJobs, 
  thunkFetchActivity 
} from "@/store/slices/dashboardSlice";
import { formatDistanceToNow, isSameDay } from "date-fns";

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress === 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export default function DashboardHome() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const stats = useAppSelector(s => s.dashboard.stats);
  const recentJobs = useAppSelector(s => s.dashboard.recentJobs);
  const activity = useAppSelector(s => s.dashboard.activity);
  const user = useAppSelector(s => s.dashboard.auth.user);

  useEffect(() => {
    void dispatch(thunkFetchDashboardStats() as any);
    void dispatch(thunkFetchRecentJobs() as any);
    void dispatch(thunkFetchActivity() as any);
  }, [dispatch]);

  const groupedActivity = useMemo(() => {
    if (!activity) return [];
    return activity.reduce((acc: any[], item: any) => {
      const last = acc[acc.length - 1];
      const itemDate = new Date(item.timestamp);
      const lastDate = last ? new Date(last.timestamp) : null;

      if (
        last && 
        last.action === item.action &&
        lastDate && isSameDay(lastDate, itemDate)
      ) {
        last.count = (last.count || 1) + 1;
      } else {
        acc.push({ ...item, count: 1 });
      }
      return acc;
    }, []);
  }, [activity]).slice(0, 5);

  const getRelativeTime = (ts: string) => {
    const date = new Date(ts);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-12 animate-in fade-in duration-700 pb-16">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0F1621] tracking-tight leading-none">
            Welcome back, {user?.firstName ? toTitleCase(user.firstName) : "Recruiter"}!
          </h1>
          <p className="text-[16px] text-[#5A6474] font-medium">Your recruitment pipeline is looking strong today.</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard/job-create")}
          className="bg-[#2B71F0] text-white px-6 py-3 rounded-2xl font-bold text-[14px] shadow-lg shadow-blue-500/20 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] flex items-center gap-2 w-fit"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create New Job
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          label="Campaigns"
          value={stats?.totalJobs ?? 0}
          trend={stats?.thisWeekJobs && stats.thisWeekJobs > 0 ? `+${stats.thisWeekJobs} this week` : "Stable volume"}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          variant="featured"
          delay={0}
        />

        <StatCard 
          label="Active Screening"
          value={stats?.activeJobs ?? 0}
          trend={stats?.activeJobs === 0 ? "Ready for new pipeline" : `${Math.round((stats?.activeJobs / (stats?.totalJobs || 1)) * 100)}% of total pool`}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          variant="outlined"
          delay={100}
        />

        <StatCard 
          label="Talent Pool"
          value={stats?.totalCandidates ?? 0}
          trend={stats?.screeningRuns ? `${stats.screeningRuns} intelligent runs` : "Awaiting ingestion"}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          variant="outlined"
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Recent Jobs Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-[#0F1621] tracking-tight">Recent Recruitment</h2>
            <Link href="/dashboard/jobs" className="text-[13px] font-black text-[#2B71F0] uppercase tracking-widest hover:underline px-4 py-2 bg-[#EEF4FF] rounded-xl transition-all">See all Portfolio</Link>
          </div>

          <div className="bg-white border border-[#E8EAED] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FB] border-b border-[#E8EAED]">
                    <th className="px-8 py-5 text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Job Campaign</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Pool</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Match</th>
                    <th className="px-6 py-5 text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-right text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F6FA]">
                  {recentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                        <div className="space-y-4 max-w-xs mx-auto">
                           <div className="h-16 w-16 bg-[#F8F9FB] rounded-full flex items-center justify-center mx-auto text-[#9BA5B4]">
                             <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                           </div>
                           <p className="text-[#5A6474] font-medium">Start your first AI screening campaign to see results here.</p>
                           <button onClick={() => router.push("/dashboard/job-create")} className="text-[#2B71F0] font-black text-[13px] uppercase tracking-widest hover:underline">Launch Campaign</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentJobs.map((job, i) => (
                      <tr 
                        key={job._id} 
                        onClick={() => router.push(`/dashboard/jobs/${job._id}/shortlist`)}
                        className="hover:bg-[#F8F9FC] transition-all duration-200 cursor-pointer group"
                      >
                        <td className="px-8 py-6">
                          <div className="font-extrabold text-[#0F1621] text-[15px] group-hover:text-[#2B71F0] transition-colors leading-tight mb-1">{job.title}</div>
                          <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-wider">Started {getRelativeTime(job.createdAt)}</div>
                        </td>
                        <td className="px-6 py-6 text-[#5A6474] font-black text-[14px]">{job.candidateCount}</td>
                        <td className="px-6 py-6">
                          {job.topCandidateScore !== null ? (
                            <div className="flex flex-col">
                               <span className="text-[#0F1621] font-black text-[15px]">{job.topCandidateScore}%</span>
                               <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-tighter">Peak Match</span>
                            </div>
                          ) : <span className="text-[#9BA5B4] font-bold">Pending</span>}
                        </td>
                        <td className="px-6 py-6">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                             job.status === "active" ? "bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20" : "bg-[#F8F9FB] text-[#5A6474] border-[#E8EAED]"
                           }`}>
                             {job.status === "active" && <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />}
                             {job.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                           <button onClick={() => router.push(`/dashboard/jobs/${job._id}/shortlist`)} className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-[#F8F9FB] text-[#9BA5B4] hover:bg-[#2B71F0] hover:text-white transition-all shadow-sm">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-[#0F1621] tracking-tight">Timeline</h2>
            <Link href="/dashboard/activity" className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest hover:text-[#2B71F0] transition-colors">History</Link>
          </div>

          <div className="bg-white border border-[#E8EAED] rounded-3xl p-8 shadow-sm relative overflow-hidden">
             {/* Timeline track */}
             <div className="absolute left-[43px] top-12 bottom-12 w-[1px] bg-[#E8EAED]" />
             
             {groupedActivity.length === 0 ? (
                <div className="py-10 text-center text-[#9BA5B4]">
                   <p className="text-sm font-medium">No recent signals recorded.</p>
                </div>
             ) : (
                <div className="space-y-10 relative">
                   {groupedActivity.map((item, i) => (
                      <div key={i} className="flex items-start gap-6 animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${300 + i * 80}ms` }}>
                         <div className="relative z-10">
                            <ActivityIcon action={item.action} />
                         </div>
                         <div className="flex-1 min-w-0 pt-0.5">
                            <div className="text-[14px] font-bold text-[#0F1621] leading-snug">
                               <ActivityText item={item} router={router} />
                               {item.count > 1 && <span className="inline-block ml-2 px-1.5 py-0.5 bg-[#F5F6FA] text-[#9BA5B4] rounded text-[10px] font-black">{item.count}X</span>}
                            </div>
                            <div className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               {getRelativeTime(item.timestamp)}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Internal Sub-components ---

function StatCard({ label, value, trend, trendHref, icon, variant, delay }: any) {
  const animatedValue = useCountUp(value);
  const isFeatured = variant === "featured";

  return (
    <div 
      className={`
        group relative rounded-[28px] p-8 flex flex-col transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both overflow-hidden
        ${isFeatured ? "bg-[#2B71F0] text-white shadow-2xl shadow-blue-500/20 translate-y-[-4px]" : "bg-white border border-[#E8EAED] shadow-sm hover:shadow-xl hover:translate-y-[-4px]"}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Visual embellishment */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150 ${isFeatured ? "bg-white" : "bg-[#2B71F0]"}`} />

      <div className="flex items-center justify-between mb-8">
        <div className={`
          h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-6
          ${isFeatured ? "bg-white/20 text-white border border-white/10 shadow-inner" : "bg-[#F5F8FF] text-[#2B71F0] border border-[#EEF4FF] shadow-sm"}
        `}>
          {icon}
        </div>
        {/* Internal Accent Bar for outlined variant */}
        {!isFeatured && (
          <div className="w-1.5 rounded-full h-8 bg-[#2B71F0]/10" />
        )}
      </div>

      <div className="space-y-1">
        <div className={`text-[12px] font-black uppercase tracking-[0.2em] ${isFeatured ? "text-white/60" : "text-[#9BA5B4]"}`}>{label}</div>
        <div className="text-5xl font-black tracking-tighter">{animatedValue}</div>
      </div>

      <div className="mt-6 pt-6 border-t border-current/10">
        {trendHref ? (
          <Link href={trendHref} className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2 group/link ${isFeatured ? "text-white" : "text-[#2B71F0]"}`}>
            {trend} <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        ) : (
          <span className={`text-[11px] font-bold uppercase tracking-widest ${isFeatured ? "text-white/50" : "text-[#9BA5B4]"}`}>{trend}</span>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const map: Record<string, { icon: any, bg: string, color: string }> = {
    JOB_CREATED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, bg: "bg-[#EEF4FF]", color: "text-[#2B71F0]" },
    SCREENING_TRIGGERED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: "bg-[#DCFCE7]", color: "text-[#10B981]" },
    PROFILES_INGESTED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, bg: "bg-[#FEF9C3]", color: "text-[#D97706]" },
    BULK_UPLOAD: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>, bg: "bg-amber-100", color: "text-amber-600" },
    LOGIN: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, bg: "bg-[#F1F5F9]", color: "text-[#5A6474]" },
    LOGOUT: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, bg: "bg-red-50", color: "text-red-500" },
  };
  const m = map[action] || map.LOGIN;
  return (
    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${m.bg} ${m.color} shadow-sm border border-current/10`}>
      {m.icon}
    </div>
  );
}

function ActivityText({ item, router }: { item: any, router: any }) {
  if (item.action === "JOB_CREATED") return (
    <span className="cursor-pointer hover:text-[#2B71F0] transition-colors" onClick={() => item.resourceId && router.push(`/dashboard/jobs/${item.resourceId}/shortlist`)}>
      Created campaign: <span className="font-black text-[#0F1621]">{item.resourceTitle || "Untitled"}</span>
    </span>
  );
  if (item.action === "SCREENING_TRIGGERED") return (
    <span className="cursor-pointer hover:text-[#2B71F0] transition-colors" onClick={() => item.resourceId && router.push(`/dashboard/jobs/${item.resourceId}/shortlist`)}>
      Analyzed <span className="font-black text-[#0F1621]">{item.metadata?.applicantIdsCount || "many"}</span> candidates
    </span>
  );
  if (item.action === "PROFILES_INGESTED") return (
    <span>Added <span className="font-black text-[#0F1621]">{item.metadata?.count || ""}</span> profiles to pool</span>
  );
  if (item.action === "LOGIN") return <span>Signed in to console</span>;
  if (item.action === "LOGOUT") return <span>Session terminated</span>;
  
  return <span className="capitalize">{item.action.replace("_", " ").toLowerCase()}</span>;
}
