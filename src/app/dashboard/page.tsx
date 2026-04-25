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
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#0F1621]">
          Welcome back, {user?.firstName ? toTitleCase(user.firstName) : "Recruiter"}!
        </h1>
        <p className="text-sm text-[#5A6474]">Here's what's happening with your recruitment pipeline.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Blue Featured */}
        <StatCard 
          label="Total Jobs Created"
          value={stats?.totalJobs ?? 0}
          trend={stats?.thisWeekJobs && stats.thisWeekJobs > 0 ? `+${stats.thisWeekJobs} this week` : null}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          variant="featured"
          delay={0}
        />

        {/* Card 2: White Active */}
        <StatCard 
          label="Jobs Open for Screening"
          value={stats?.activeJobs ?? 0}
          trend={stats?.activeJobs === 0 ? "Create a job →" : `of ${stats?.totalJobs ?? 0} total`}
          trendHref={stats?.activeJobs === 0 ? "/dashboard/job-create" : undefined}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          variant="outlined"
          delay={80}
        />

        {/* Card 3: White Candidates */}
        <StatCard 
          label="Candidates Screened"
          value={stats?.totalCandidates ?? 0}
          trend={stats?.screeningRuns ? `${stats.screeningRuns} screening runs` : null}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          variant="outlined"
          delay={160}
        />
      </div>

      {/* Recent Jobs Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0F1621]">Recent jobs</h2>
          <Link href="/dashboard/jobs" className="text-sm font-medium text-[#2B71F0] hover:underline">See all →</Link>
        </div>

        <div className="bg-white border border-[#E8EAED] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead className="bg-[#F5F6FA] border-b border-[#E8EAED]">
                <tr className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Candidates</th>
                  <th className="px-6 py-4">Last Screening</th>
                  <th className="px-6 py-4">Top Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F6FA]">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="space-y-4">
                        <p className="text-[#5A6474]">No jobs created yet.</p>
                        <button onClick={() => router.push("/dashboard/job-create")} className="bg-[#2B71F0] text-white px-6 py-2.5 rounded-lg font-semibold text-sm">Create first job</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job, i) => (
                    <tr 
                      key={job._id} 
                      onClick={() => router.push(`/dashboard/jobs/${job._id}/shortlist`)}
                      className="hover:bg-[#F8F9FC] transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both group"

                      style={{ animationDelay: `${200 + i * 60}ms` }}
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-[#0F1621] line-clamp-2 leading-tight" title={job.title}>{job.title}</div>
                        <div className="text-[12px] text-[#9BA5B4] mt-1">Created {getRelativeTime(job.createdAt)}</div>
                      </td>
                      <td className="px-6 py-5 text-[#5A6474] font-medium">{job.candidateCount}</td>
                      <td className="px-6 py-5 text-[#5A6474] text-sm">
                        {job.lastScreeningAt ? getRelativeTime(job.lastScreeningAt) : <span className="text-[#9BA5B4] italic">Not screened yet</span>}
                      </td>
                      <td className="px-6 py-5">
                        {job.topCandidateScore !== null ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2B71F0] text-[12px] font-bold">
                            {job.topCandidateScore}%
                          </span>
                        ) : <span className="text-[#9BA5B4]">—</span>}
                      </td>
                      <td className="px-6 py-5">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                           job.status === "active" ? "bg-[#2B71F0] text-white" : "bg-[#E8EAED] text-[#5A6474]"
                         }`}>
                           {job.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                           {job.status}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                           {job.candidateCount > 0 && (
                             <button onClick={() => router.push(`/dashboard/jobs/${job._id}/screen`)} className="bg-[#2B71F0] hover:bg-[#1A5CE0] text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors">Screen</button>
                           )}
                           {job.screeningCount > 0 && (
                             <button onClick={() => router.push(`/dashboard/jobs/${job._id}/shortlist`)} className="bg-white border border-[#E8EAED] text-[#5A6474] px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#F5F6FA] transition-colors">Results</button>
                           )}
                        </div>
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
      <div className="bg-white border border-[#E8EAED] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#0F1621]">Recent activity</h2>
          <Link href="/dashboard/activity" className="text-sm font-medium text-[#2B71F0] hover:underline">View all →</Link>
        </div>

        {groupedActivity.length === 0 ? (
          <div className="p-8 text-center text-[#9BA5B4] text-sm flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-[#E8EAED]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>Your activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-4 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${400 + i * 50}ms` }}>
                <ActivityIcon action={item.action} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-[#5A6474]">
                    <ActivityText item={item} router={router} />
                    {item.count > 1 && <span className="text-[#9BA5B4] ml-1">— {item.count} times today</span>}
                  </p>
                  <p className="text-[11px] text-[#9BA5B4]">{getRelativeTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
        relative rounded-xl py-5 pr-5 flex items-start gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both
        border-l-[3px] border-l-[#2B71F0]
        ${isFeatured ? "bg-[#2B71F0] text-white border-l-white" : "bg-white border border-[#E8EAED] shadow-sm hover:shadow-md hover:-translate-y-0.5"}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pl-5 flex-1">
        <div className={`text-[14px] font-medium ${isFeatured ? "text-white/80" : "text-[#5A6474]"}`}>{label}</div>
        <div className="text-3xl font-extrabold mt-1 tracking-tight">{animatedValue}</div>
        <div className="mt-2 h-4">
          {trendHref ? (
            <Link href={trendHref} className="text-[12px] font-bold text-[#2B71F0] hover:underline">{trend}</Link>
          ) : (
            <span className={`text-[13px] ${isFeatured ? "text-white/60" : "text-[#9BA5B4]"}`}>{trend}</span>
          )}
        </div>
      </div>
      <div className={`
        h-11 w-11 rounded-full flex items-center justify-center shrink-0
        ${isFeatured ? "bg-white/20 text-white" : "bg-[#EEF4FF] text-[#2B71F0]"}
      `}>
        {icon}
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const map: Record<string, { icon: any, bg: string, color: string }> = {
    JOB_CREATED: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, bg: "bg-[#EEF4FF]", color: "text-[#2B71F0]" },
    SCREENING_TRIGGERED: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: "bg-[#DCFCE7]", color: "text-[#10B981]" },
    PROFILES_INGESTED: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, bg: "bg-[#FEF9C3]", color: "text-[#D97706]" },
    BULK_UPLOAD: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>, bg: "bg-[#FEF9C3]", color: "text-[#D97706]" },
    LOGIN: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, bg: "bg-[#F1F5F9]", color: "text-[#5A6474]" },
    LOGOUT: { icon: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, bg: "bg-[#F1F5F9]", color: "text-[#5A6474]" },
  };
  const m = map[action] || map.LOGIN;
  return (
    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.bg} ${m.color}`}>
      {m.icon}
    </div>
  );
}

function ActivityText({ item, router }: { item: any, router: any }) {
  const isJobAction = item.action === "JOB_CREATED" || item.action === "SCREENING_TRIGGERED";
  
  if (item.action === "JOB_CREATED") return (
    <span className="cursor-pointer hover:text-[#2B71F0] transition-colors" onClick={() => item.resourceId && router.push(`/dashboard/jobs/${item.resourceId}`)}>
      Created job: <span className="font-bold text-[#0F1621]">{item.resourceTitle || "Untitled"}</span>
    </span>
  );
  if (item.action === "SCREENING_TRIGGERED") return (
    <span className="cursor-pointer hover:text-[#2B71F0] transition-colors" onClick={() => item.resourceId && router.push(`/dashboard/jobs/${item.resourceId}/shortlist`)}>
      Screened <span className="font-bold text-[#0F1621]">{item.metadata?.applicantIdsCount || "many"}</span> candidates
    </span>
  );
  if (item.action === "PROFILES_INGESTED") return (
    <span>Ingested <span className="font-bold text-[#0F1621]">{item.metadata?.count || ""}</span> profiles</span>
  );
  if (item.action === "LOGIN") return <span>Signed in to platform</span>;
  if (item.action === "LOGOUT") return <span>Signed out</span>;
  
  return <span>{item.action.replace("_", " ")}</span>;
}
