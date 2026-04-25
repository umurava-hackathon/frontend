"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchResults, thunkFetchJob } from "@/store/slices/dashboardSlice";
import { ScoreRing } from "@/components/candidates/ScoreRing";
import { BreakdownBars } from "@/components/candidates/BreakdownBars";
import { RecommendationBadge } from "@/components/candidates/RecommendationBadge";
import { BiasIndicator } from "@/components/candidates/BiasIndicator";
import { CandidateChatbot } from "@/components/candidates/CandidateChatbot";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const PDFDownloadButton = dynamic(
  () => import("@/components/reports/PDFDownloadButton"),
  { ssr: false, loading: () => <span className="text-[10px] text-neutral-400">Loading PDF...</span> }
);

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { candidateName, firstName, lastName, name, fullName, email, applicantId } = c;
  if (candidateName) return candidateName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || name || fullName || email || `Candidate ${applicantId?.slice(-4) || "????"}`;
}

const ShimmerCard = () => (
  <div className="h-[120px] rounded-2xl border border-neutral-100 bg-white animate-pulse flex items-center px-8 gap-6 shadow-sm">
    <div className="h-11 w-11 rounded-xl bg-neutral-50" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-neutral-50 rounded-lg w-1/3" />
      <div className="h-3 bg-neutral-50 rounded-lg w-1/4" />
    </div>
    <div className="h-10 w-32 bg-neutral-50 rounded-xl" />
  </div>
);

export default function ShortlistPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const results = useAppSelector((s) => s.dashboard.results);
  const loading = useAppSelector((s) => s.dashboard.loading);
  const currentJob = useAppSelector((s) => s.dashboard.currentJob);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recFilter, setRecFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
    void dispatch(thunkFetchJob(jobId) as any);
  }, [jobId, dispatch]);

  const allCandidates = useMemo(() => {
    return (results?.shortlist ?? []).map((c: any) => ({
      ...c,
      matchScore: Number(c.matchScore),
      confidence: typeof c.confidence === "number" ? c.confidence : undefined
    }));
  }, [results?.shortlist]);

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter(c => {
      const name = getDisplayName(c).toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesRec = recFilter === "all" || c.recommendation === recFilter;
      return matchesSearch && matchesRec;
    });
  }, [allCandidates, searchTerm, recFilter]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage, itemsPerPage]);

  return (
    <div className="max-w-[1300px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header & Actions */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-[#0F1621] tracking-tight leading-none">Ranked Shortlist</h1>
            <p className="text-[16px] text-[#5A6474] font-medium max-w-xl leading-relaxed">AI-powered ranking based on your defined requirements and scoring weights.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 px-5 rounded-2xl border border-[#E8EAED] shadow-sm">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-[#9BA5B4] uppercase tracking-[0.2em] mb-0.5">Target Hire</span>
                <span className="text-[20px] font-black text-[#2B71F0]">Top {results?.topN || 10}</span>
             </div>
             <div className="h-10 w-[1px] bg-[#E8EAED]" />
             <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-[#9BA5B4] uppercase tracking-[0.2em] mb-0.5">Pool Size</span>
                <span className="text-[20px] font-black text-[#0F1621]">{allCandidates.length}</span>
             </div>
          </div>
        </div>

        {/* Cohesive Action Bar */}
        <div className="bg-white border border-[#E8EAED] p-2.5 rounded-[22px] shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-3">
          {currentJob && !currentJob.isScreened && (
             <button
               type="button"
               onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/ingest`)}
               className="flex-1 lg:flex-none px-6 py-3 bg-[#2B71F0] text-white rounded-xl text-[13.5px] font-bold hover:bg-[#1A5CE0] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 whitespace-nowrap active:scale-[0.98]"
             >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Continue Ingestion
             </button>
          )}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="flex-1 lg:flex-none px-6 py-3 bg-[#F5F8FF] text-[#2B71F0] rounded-xl text-[13.5px] font-bold hover:bg-[#EBF1FF] transition-all flex items-center justify-center gap-2.5 whitespace-nowrap active:scale-[0.98]"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Compare Mode
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/report`)}
            className="flex-1 lg:flex-none px-6 py-3 bg-white border border-[#E8EAED] text-[#5A6474] rounded-xl text-[13.5px] font-bold hover:bg-[#F8F9FB] hover:text-[#0F1621] transition-all whitespace-nowrap active:scale-[0.98]"
          >
            View Full Report
          </button>
          
          <div className="h-8 w-[1px] bg-[#E8EAED] hidden lg:block mx-1" />
          
          <div className="flex-1 lg:flex-none">
            <PDFDownloadButton
              variant="full"
              jobTitle="Shortlist Report"
              jobId={jobId}
              runDate={new Date().toLocaleDateString()}
              status="succeeded"
              totalTopN={results?.topN}
              candidates={allCandidates as any[]}
            />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-6 items-center">
         <div className="relative flex-1 w-full group">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search candidate by name..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-13 pr-6 py-4 bg-white border border-[#E8EAED] rounded-2xl text-[15px] font-medium focus-ring outline-none shadow-sm transition-all placeholder:text-[#9BA5B4]"
            />
         </div>
         <div className="flex items-center gap-4 w-full sm:w-auto">
            <select 
              value={recFilter}
              onChange={e => { setRecFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 sm:w-64 px-6 py-4 bg-white border border-[#E8EAED] rounded-2xl text-[15px] font-bold text-[#5A6474] focus-ring outline-none shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%239BA5B4%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px] bg-[right_20px_center] bg-no-repeat transition-all"
            >
              <option value="all">All Recommendations</option>
              <option value="SHORTLIST">Shortlist Only</option>
              <option value="CONSIDER">Consider Only</option>
              <option value="DECLINE">Decline Only</option>
            </select>
            <div className="h-14 flex items-center px-6 bg-white border border-[#E8EAED] rounded-2xl shadow-sm">
               <span className="text-[13px] font-black text-[#2B71F0] uppercase tracking-widest whitespace-nowrap">
                  {filteredCandidates.length} Found
               </span>
            </div>
         </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {loading ? (
          [1, 2, 3].map((i) => <ShimmerCard key={i} />)
        ) : paginatedCandidates.length === 0 ? (
          <div className="py-24 text-center bg-white border border-[#E8EAED] rounded-3xl border-dashed">
            <div className="h-16 w-16 bg-[#F8F9FB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#9BA5B4]">
               <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-[#5A6474] font-medium">No candidates match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {paginatedCandidates.map((c: any) => {
              const isExpanded = expandedId === c.applicantId;
              return (
                <div 
                  key={c.applicantId}
                  onClick={() => setExpandedId(isExpanded ? null : c.applicantId)}
                  className={classNames(
                    "rounded-3xl border border-[#E8EAED] p-7 bg-white cursor-pointer transition-all duration-400 relative overflow-hidden",
                    isExpanded ? "shadow-xl ring-2 ring-[#2B71F0]/5 translate-y-[-2px]" : "shadow-sm hover:shadow-md hover:translate-y-[-2px]"
                  )}
                >
                  {/* Internal Accent Bar */}
                  <div 
                    className={classNames(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-2 rounded-r-full h-[50%] transition-all duration-500",
                      isExpanded ? "bg-[#2B71F0] h-[70%]" : "bg-[#E8EAED]"
                    )}
                  />

                  <div className="pl-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-[#F5F6FA] text-[#0F1621] font-black text-lg flex items-center justify-center shrink-0 border border-[#E8EAED] shadow-inner">
                        {c.rank}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[19px] font-extrabold text-[#0F1621] truncate tracking-tight">{getDisplayName(c)}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[14px] text-[#5A6474] font-medium truncate leading-none">{c.candidateHeadline || "No headline provided"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-start lg:self-auto lg:ml-auto">
                      <div className="flex flex-col items-end gap-2">
                        <BiasIndicator biasFlags={c.biasFlags} />
                        <div className="flex gap-2">
                          {c.resumeParsed ? (
                            <span className="px-3 py-1 rounded-lg bg-[#F0FDF4] text-[#059669] text-[10px] font-black uppercase tracking-[0.05em] border border-[#10B981]/30 flex items-center gap-1.5">
                              <div className="h-1 w-1 rounded-full bg-[#059669]" />
                              Resume Parsed
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-lg bg-[#F8F9FB] text-[#5A6474] text-[10px] font-black uppercase tracking-[0.05em] border border-[#E8EAED]">
                              CSV Profile
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-10 w-[1px] bg-[#F5F6FA] hidden sm:block" />
                      <RecommendationBadge value={c.recommendation} />
                      <ScoreRing score={c.matchScore} size={54} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-10 pt-10 border-t border-[#F5F6FA] grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <div className="space-y-5">
                              <div className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Score Attribution</div>
                              <BreakdownBars breakdown={c.scoreBreakdown} />
                              
                              <div className="pt-6 flex flex-col gap-3 border-t border-[#F5F6FA]">
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-[#5A6474] font-bold">AI Consistency Rating</span>
                                  <span className={classNames(
                                    "px-2 py-0.5 rounded-md font-black text-[11px] uppercase tracking-wider",
                                    c.confidence >= 0.7 ? "bg-[#F0FDF4] text-[#10B981]" : c.confidence >= 0.5 ? "bg-amber-50 text-amber-600" : "bg-[#F8F9FB] text-[#9BA5B4]"
                                  )}>
                                    {Math.round(c.confidence * 100)}% Match Confidence
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-[#5A6474] font-bold">Verification Source</span>
                                  <span className="font-black text-[#0F1621] uppercase tracking-[0.05em] text-[11px]">
                                    {c.dataSource?.replace("_", " ") ?? "External Database"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">AI Synthesis</div>
                              <p className="text-[15px] leading-relaxed text-[#5A6474] font-medium italic bg-[#F8F9FB] p-6 rounded-3xl border border-[#E8EAED] relative">
                                <span className="absolute top-4 left-4 text-4xl text-[#2B71F0]/10 font-serif">“</span>
                                {c.reasoning}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-4">
                              <div className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">High Impact Strengths</div>
                              <div className="flex flex-wrap gap-3">
                                {(c.strengths || []).map((s: string, i: number) => (
                                  <span key={i} className="px-4 py-2 rounded-2xl bg-[#F0FDF4] text-[#166534] text-[13px] font-bold border border-[#86EFAC]/50 flex items-center gap-2">
                                     <div className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                                     {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Development Areas</div>
                              <div className="flex flex-wrap gap-3">
                                {(c.gaps || []).map((g: string, i: number) => (
                                  <span key={i} className="px-4 py-2 rounded-2xl bg-red-50 text-red-700 text-[13px] font-bold border border-red-100 flex items-center gap-2">
                                     <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                     {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="bg-white border border-[#E8EAED] rounded-[28px] p-4 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4 pl-4">
              <span className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Display</span>
              <div className="relative">
                <select 
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-[#F8F9FB] border border-[#E8EAED] rounded-xl px-4 py-2 text-[13px] font-black text-[#0F1621] outline-none focus:border-[#2B71F0] appearance-none pr-8 cursor-pointer"
                >
                  {[5, 10, 15, 20, 50].map(v => (
                    <option key={v} value={v}>{v} Profiles</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9BA5B4]">
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-3 pr-2">
             <button 
               disabled={currentPage === 1}
               onClick={() => setCurrentPage(p => p - 1)}
               className="h-11 px-6 rounded-2xl border border-[#E8EAED] bg-white text-[13px] font-black text-[#5A6474] disabled:opacity-30 hover:bg-[#F8F9FB] transition-all active:scale-[0.95]"
             >
               Prev
             </button>
             <div className="hidden md:flex gap-1.5">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={classNames(
                      "w-11 h-11 rounded-2xl text-[13px] font-black transition-all",
                      currentPage === p 
                        ? "bg-[#2B71F0] text-white shadow-lg shadow-blue-500/20 scale-105" 
                        : "text-[#5A6474] hover:bg-[#F8F9FB] hover:text-[#2B71F0]"
                    )}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 5 && <span className="flex items-end pb-3 px-2 text-[#9BA5B4] font-black tracking-widest">...</span>}
             </div>
             <span className="md:hidden text-[13px] font-black text-[#0F1621]">Page {currentPage} / {totalPages}</span>
             <button 
               disabled={currentPage === totalPages || totalPages === 0}
               onClick={() => setCurrentPage(p => p + 1)}
               className="h-11 px-6 rounded-2xl border border-[#E8EAED] bg-white text-[13px] font-black text-[#5A6474] disabled:opacity-30 hover:bg-[#F8F9FB] transition-all active:scale-[0.95]"
             >
               Next
             </button>
           </div>
        </div>
      )}

      <CandidateChatbot 
        jobId={jobId as string}
        jobTitle={currentJob?.title || "this job"}
        candidateCount={results?.shortlist?.length || 0}
        hasResults={!!results?.shortlist?.length}
      />
    </div>
  );
}
