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
import { DashboardChatbot } from "@/components/dashboard/DashboardChatbot";

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
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-500 pb-16 font-jakarta">
      {/* Friendly Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621] tracking-tight">
            Hello, {user?.firstName ? toTitleCase(user.firstName) : "Recruiter"}
          </h1>
          <p className="text-sm text-[#5A6474] font-medium">Here is a quick overview of your recruitment pipeline.</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard/job-create")}
          className="bg-[#2B71F0] text-white px-6 py-2.5 rounded-xl font-bold text-[13px] shadow-lg shadow-blue-500/10 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] flex items-center gap-2 w-fit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </button>
      </div>

      {/* Simplified Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Campaigns" value={stats?.totalJobs ?? 0} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <StatCard label="Active Screening" value={stats?.activeJobs ?? 0} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard label="Total Pool" value={stats?.totalCandidates ?? 0} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Simplified Recent Jobs */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-[#0F1621]">Recent Activity</h2>
            <Link href="/dashboard/jobs" className="text-[12px] font-bold text-[#2B71F0] hover:underline">View Portfolio</Link>
          </div>

          <div className="bg-white border border-[#E8EAED] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FB] border-b border-[#E8EAED]">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">Campaign</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest text-center">Pool</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F6FA]">
                  {recentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[#9BA5B4] text-sm">No recent campaigns.</td>
                    </tr>
                  ) : (
                    recentJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-[#F8F9FB] transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/jobs/${job._id}`)}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0F1621] text-[14px] group-hover:text-[#2B71F0] transition-colors">{job.title}</div>
                          <div className="text-[11px] text-[#9BA5B4]">{getRelativeTime(job.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#5A6474] text-[13px]">{job.candidateCount}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                             job.status === "active" ? "bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20" : "bg-[#F8F9FB] text-[#9BA5B4] border-[#E8EAED]"
                           }`}>
                             {job.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <svg className="h-4 w-4 text-[#E8EAED] group-hover:text-[#2B71F0] transition-colors inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Simplified Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#0F1621] px-1">Timeline</h2>
          <div className="bg-white border border-[#E8EAED] rounded-2xl p-6 shadow-sm">
             {groupedActivity.length === 0 ? (
                <p className="text-center py-6 text-[#9BA5B4] text-sm italic">No signals yet.</p>
             ) : (
                <div className="space-y-6">
                   {groupedActivity.map((item, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="h-8 w-8 rounded-lg bg-[#F8F9FB] border border-[#E8EAED] flex items-center justify-center shrink-0">
                            <ActivityIconTiny action={item.action} />
                         </div>
                         <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#0F1621] leading-snug">
                               <ActivityText item={item} router={router} />
                            </div>
                            <div className="text-[10px] text-[#9BA5B4] font-bold uppercase mt-1">{getRelativeTime(item.timestamp)}</div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
      <DashboardChatbot />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: any }) {
  const animatedValue = useCountUp(value);
  return (
    <div className="bg-white border border-[#E8EAED] rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
       <div className="h-12 w-12 rounded-xl bg-[#F5F8FF] text-[#2B71F0] flex items-center justify-center shrink-0 border border-[#EEF4FF]">
          {icon}
       </div>
       <div>
          <div className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-[0.15em] mb-0.5">{label}</div>
          <div className="text-2xl font-bold text-[#0F1621]">{animatedValue}</div>
       </div>
    </div>
  );
}

function ActivityIconTiny({ action }: { action: string }) {
  if (action.includes("JOB")) return <span className="text-blue-500 text-[12px]">💼</span>;
  if (action.includes("SCREENING")) return <span className="text-emerald-500 text-[12px]">⚡</span>;
  if (action.includes("PROFILES")) return <span className="text-amber-500 text-[12px]">👤</span>;
  return <span className="text-slate-400 text-[12px]">●</span>;
}

function ActivityText({ item, router }: { item: any, router: any }) {
  if (item.action === "JOB_CREATED") return <span>Created <span className="font-bold">{item.resourceTitle || "Job"}</span></span>;
  if (item.action === "SCREENING_TRIGGERED") return <span>Analyzed candidates for <span className="font-bold">{item.resourceTitle || "Campaign"}</span></span>;
  if (item.action === "PROFILES_INGESTED") return <span>Added {item.metadata?.count || ""} applicants</span>;
  return <span className="capitalize">{item.action.replace("_", " ").toLowerCase()}</span>;
}
