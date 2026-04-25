"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  thunkFetchApplicants,
  thunkTriggerScreening,
  clearResults
} from "@/store/slices/dashboardSlice";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { firstName, lastName, name, fullName, email, id, applicantId } = c;
  
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return (
    firstName ||
    lastName ||
    name ||
    fullName ||
    email ||
    `Candidate ${(id || applicantId)?.slice(-4) || "????"}`
  );
}

export default function ScreenPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  
  const applicants = useAppSelector((s) => s.dashboard.applicants);
  const { triggering, error } = useAppSelector((s) => s.dashboard.screening);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topN, setTopN] = useState<10 | 20>(10);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchApplicants(jobId) as any);
  }, [jobId, dispatch]);

  const readyApplicants = useMemo(() => {
    return (applicants ?? []).filter((a) => a.ingestionStatus === "ready");
  }, [applicants]);

  const toggleAll = () => {
    if (selectedIds.length === readyApplicants.length) setSelectedIds([]);
    else setSelectedIds(readyApplicants.map((a) => a.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleStart = async () => {
    if (!jobId || selectedIds.length === 0) return;
    dispatch(clearResults());
    const resAction = await dispatch(
      thunkTriggerScreening({
        jobId,
        topN,
        applicantIds: selectedIds,
      }) as any
    );
    if (thunkTriggerScreening.fulfilled.match(resAction)) {
      router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`);
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0F1621] tracking-tight leading-none">AI Screening Parameters</h1>
          <p className="text-[16px] text-[#5A6474] font-medium max-w-xl">Fine-tune the intelligence engine and select candidates for this evaluation run.</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist`)}
          className="bg-white border-2 border-[#E8EAED] text-[#5A6474] px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-[#F8F9FC] hover:text-[#0F1621] transition-all flex items-center gap-2 w-fit active:scale-95 shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
          Back to Results
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative bg-white border border-[#E8EAED] rounded-[32px] p-8 shadow-sm space-y-10 overflow-hidden">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full h-[30%] bg-[#2B71F0]" />

            <div className="space-y-6 pl-2">
               <div className="space-y-4">
                 <h2 className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Shortlist Intensity</h2>
                 <div className="grid grid-cols-2 gap-3">
                   {[10, 20].map((n) => (
                     <button
                       key={n}
                       onClick={() => setTopN(n as any)}
                       className={classNames(
                         "py-4 rounded-2xl border-2 text-[15px] font-black transition-all",
                         topN === n 
                           ? "bg-[#F0F7FF] border-[#2B71F0] text-[#2B71F0] shadow-lg shadow-blue-500/5" 
                           : "bg-white border-[#E8EAED] text-[#5A6474] hover:border-[#BBCFFF]"
                       )}
                     >
                       Top {n}
                     </button>
                   ))}
                 </div>
                 <p className="text-[12px] text-[#9BA5B4] font-medium leading-relaxed italic">
                   The AI will analyze all {selectedIds.length} candidates but prioritize deep synthesis for your top {topN}.
                 </p>
               </div>

               <div className="h-px bg-[#F5F6FA] w-full" />

               <div className="space-y-4">
                 <h2 className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Selection Metrics</h2>
                 <div className="bg-[#F8F9FC] rounded-2xl p-5 space-y-4 border border-[#E8EAED]">
                   <div className="flex justify-between items-center">
                     <span className="text-[13px] font-bold text-[#5A6474] uppercase tracking-tight">Scope</span>
                     <span className="text-[16px] font-black text-[#0F1621]">{selectedIds.length} Profiles</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[13px] font-bold text-[#5A6474] uppercase tracking-tight">Extraction</span>
                     <span className="text-[16px] font-black text-[#2B71F0]">Deep Parse</span>
                   </div>
                 </div>
               </div>

               {error && (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[#DC2626] text-[13px] font-black uppercase tracking-tight text-center">
                   {error}
                 </div>
               )}

               <button
                 onClick={handleStart}
                 disabled={triggering || selectedIds.length === 0}
                 className="w-full bg-[#2B71F0] text-white py-5 rounded-[22px] font-black text-[15px] uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-[#1A5CE0] hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 active:scale-95 flex items-center justify-center gap-3 mt-4"
               >
                 {triggering ? (
                   <>
                     <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Initializing AI...
                   </>
                 ) : (
                   <>
                     Start AI Screening
                     <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>

        {/* Right: Candidate List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E8EAED] rounded-[40px] shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="px-10 py-6 bg-[#F8F9FC] border-b border-[#E8EAED] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                 <span className="text-[12px] font-black text-[#0F1621] uppercase tracking-[0.2em]">
                   Eligible Candidates ({readyApplicants.length})
                 </span>
              </div>
              <button
                onClick={toggleAll}
                className="text-[12px] font-black text-[#2B71F0] uppercase tracking-widest hover:underline px-4 py-2 hover:bg-[#EEF4FF] rounded-xl transition-all"
              >
                {selectedIds.length === readyApplicants.length ? "Deselect all" : "Select all pool"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {readyApplicants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <div className="h-20 w-20 rounded-[32px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] flex items-center justify-center text-[#9BA5B4]">
                     <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[18px] font-black text-[#0F1621]">The candidate pool is empty</p>
                     <p className="text-[14px] text-[#5A6474] font-medium max-w-xs">You need to ingest some talent profiles before you can run an AI screening.</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/dashboard/jobs/${jobId}/ingest`)}
                    className="bg-[#2B71F0] text-white px-10 py-3.5 rounded-[18px] font-black text-[13px] uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-[#1A5CE0] transition-all"
                  >
                    Go to Ingestion
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {readyApplicants.map((a) => {
                    const isSelected = selectedIds.includes(a.id);
                    return (
                      <div 
                        key={a.id}
                        onClick={() => toggleOne(a.id)}
                        className={classNames(
                          "group relative px-8 py-5 rounded-[24px] border-2 flex items-center gap-6 cursor-pointer transition-all duration-300",
                          isSelected ? "bg-[#F0F7FF] border-[#2B71F0] shadow-sm shadow-blue-500/5" : "bg-white border-[#F5F6FA] hover:border-[#BBCFFF]"
                        )}
                      >
                        <div className={classNames(
                          "h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                          isSelected ? "bg-[#2B71F0] border-[#2B71F0] scale-110 shadow-lg shadow-blue-500/20" : "border-[#E8EAED] bg-[#F8F9FC] group-hover:border-[#BBCFFF]"
                        )}>
                          {isSelected && <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={classNames("text-[16px] font-black transition-colors leading-tight", isSelected ? "text-[#0F1621]" : "text-[#5A6474] group-hover:text-[#0F1621]")}>{getDisplayName(a)}</div>
                          <div className="text-[12px] text-[#9BA5B4] font-bold truncate mt-1 uppercase tracking-wider">{a.email || "No direct email"}</div>
                        </div>
                        <div className="flex items-center gap-3">
                           {a.sourceType && (
                             <span className={classNames("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all", isSelected ? "bg-white text-[#2B71F0] border-[#DDE7FF]" : "bg-[#F8F9FC] text-[#9BA5B4] border-[#E8EAED]")}>
                               {a.sourceType.replace("_", " ")}
                             </span>
                           )}
                           <div className={classNames("h-8 w-8 rounded-xl flex items-center justify-center transition-all", isSelected ? "bg-[#2B71F0] text-white" : "bg-[#F8F9FC] text-[#E8EAED]")}>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
