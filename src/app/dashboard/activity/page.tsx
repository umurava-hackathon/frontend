"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchActivity } from "@/store/slices/dashboardSlice";
import { formatDistanceToNow } from "date-fns";

const formatIP = (ip: string) =>
  ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1"
    ? "Local" 
    : ip;

export default function ActivityPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activity = useAppSelector(s => s.dashboard.activity);
  const [searchTerm, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    void dispatch(thunkFetchActivity() as any);
  }, [dispatch]);

  const filteredActivity = useMemo(() => {
    if (!activity) return [];
    return activity.filter(item => {
      const content = `${item.action} ${item.resourceTitle || ""}`.toLowerCase();
      return content.includes(searchTerm.toLowerCase());
    });
  }, [activity, searchTerm]);

  const paginatedActivity = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActivity.slice(start, start + itemsPerPage);
  }, [filteredActivity, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);

  const getRelativeTime = (ts: string) => {
    const date = new Date(ts);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const activityIcons: Record<string, { icon: any, bg: string, color: string }> = {
    JOB_CREATED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, bg: "bg-[#EEF4FF]", color: "text-[#2B71F0]" },
    SCREENING_TRIGGERED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: "bg-[#DCFCE7]", color: "text-[#10B981]" },
    PROFILES_INGESTED: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, bg: "bg-[#FEF9C3]", color: "text-[#D97706]" },
    LOGIN: { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, bg: "bg-[#F1F5F9]", color: "text-[#5A6474]" },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#0F1621]">Activity Log</h1>
        <p className="text-sm text-[#5A6474]">A complete history of your actions and session events.</p>
      </div>

      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E8EAED] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#F8F9FC]">
           <div className="relative w-full sm:w-96">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search activity..." 
                value={searchTerm}
                onChange={e => { setSearchInput(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none"
              />
           </div>
           <div className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
              {filteredActivity.length} Events Total
           </div>
        </div>

        <div className="divide-y divide-[#F5F6FA]">
          {paginatedActivity.length === 0 ? (
            <div className="p-20 text-center text-[#5A6474] italic">No matching activity found.</div>
          ) : (
            paginatedActivity.map((item, i) => {
              const meta = activityIcons[item.action] || activityIcons.LOGIN;
              return (
                <div key={i} className="p-6 flex items-start gap-5 hover:bg-[#F8F9FC] transition-colors group">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} border border-[#E8EAED]`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[#0F1621] font-semibold">
                      {item.action === "JOB_CREATED" ? `Created job: ${item.resourceTitle || "Untitled"}` :
                       item.action === "SCREENING_TRIGGERED" ? `Screened ${item.metadata?.applicantIdsCount || ""} candidates` :
                       item.action === "PROFILES_INGESTED" ? `Ingested ${item.metadata?.count || ""} profiles` :
                       item.action === "LOGIN" ? "Signed in to platform" : 
                       item.action.replace("_", " ")}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[12px] text-[#9BA5B4]">{getRelativeTime(item.timestamp)}</span>
                       <span className="text-[12px] text-[#E8EAED]">&bull;</span>
                       <span className="text-[12px] text-[#5A6474] font-medium">{formatIP(item.ip || "unknown")}</span>
                    </div>
                  </div>
                  {(item.action === "JOB_CREATED" || item.action === "SCREENING_TRIGGERED") && item.resourceId && (
                    <button 
                      onClick={() => router.push(`/dashboard/jobs/${item.resourceId}`)}
                      className="text-[#2B71F0] font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View Details
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPages > 0 && (
          <div className="p-4 border-t border-[#E8EAED] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8F9FC]">
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-wider">Show</span>
                <select 
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-[#E8EAED] rounded px-2 py-1 text-xs font-bold text-[#5A6474] outline-none focus:border-[#2B71F0]"
                >
                  {[5, 10, 15, 20, 50].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-wider">per page</span>
             </div>

             <div className="flex items-center gap-4">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(p => p - 1)}
                 className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
               >
                 Previous
               </button>
               <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-widest">
                 Page {currentPage} of {totalPages || 1}
               </span>
               <button 
                 disabled={currentPage === totalPages || totalPages === 0}
                 onClick={() => setCurrentPage(p => p + 1)}
                 className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
               >
                 Next
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
