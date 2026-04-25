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
  { ssr: false, loading: () => <span className="text-[11px] font-bold text-[#9BA5B4]">PREPARING PDF...</span> }
);

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Candidate";
  const { candidateName, firstName, lastName, name, fullName, email, applicantId } = c;
  if (candidateName) return candidateName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || name || fullName || email || `ID: ${applicantId?.slice(-4) || "????"}`;
}

const ShimmerCard = () => (
  <div className="h-[120px] rounded-2xl border border-neutral-100 bg-white animate-pulse flex items-center px-8 gap-6 shadow-sm">
    <div className="h-10 w-10 rounded-xl bg-neutral-50" />
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
  const [showJD, setShowJD] = useState(false);

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
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-500 pb-24 font-jakarta">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621] tracking-tight">{currentJob?.title || "Ranked Shortlist"}</h1>
          <div className="flex items-center gap-2 text-sm text-[#5A6474]">
             <span>{allCandidates.length} candidates evaluated</span>
             <span className="h-1 w-1 rounded-full bg-[#E8EAED]" />
             <button onClick={() => setShowJD(!showJD)} className="text-[#2B71F0] font-semibold hover:underline">
                {showJD ? "Hide Job Description" : "View Job Description"}
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button
             type="button"
             onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
             className="px-5 py-2.5 bg-white border border-[#E8EAED] text-[#5A6474] rounded-xl text-[13px] font-bold hover:bg-[#F8F9FC] transition-all flex items-center gap-2"
           >
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Compare
           </button>
           <button
             type="button"
             onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/report`)}
             className="px-5 py-2.5 bg-white border border-[#E8EAED] text-[#5A6474] rounded-xl text-[13px] font-bold hover:bg-[#F8F9FC] transition-all"
           >
             Full Report
           </button>
           <PDFDownloadButton
             variant="full"
             jobTitle={currentJob?.title || "Shortlist"}
             jobId={jobId}
             runDate={new Date().toLocaleDateString()}
             status="succeeded"
             totalTopN={results?.topN}
             candidates={allCandidates as any[]}
           />
        </div>
      </div>

      <AnimatePresence>
        {showJD && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#F8F9FB] border border-[#E8EAED] rounded-2xl p-8 space-y-6">
               <h2 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-widest">Campaign Brief</h2>
               <div className="text-[15px] text-[#5A6474] leading-relaxed whitespace-pre-wrap">
                  {currentJob?.description}
               </div>
               <div className="flex flex-wrap gap-2 pt-4">
                  {(currentJob?.requirements?.mustHave || []).map((s: string) => (
                    <span key={s} className="px-3 py-1 rounded-lg bg-white border border-[#E8EAED] text-[12px] font-semibold text-[#0F1621]">{s}</span>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplified Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white border border-[#E8EAED] p-4 rounded-2xl shadow-sm">
         <div className="relative flex-1 w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FC] border border-transparent rounded-xl text-[14px] font-medium focus:bg-white focus:border-[#2B71F0]/20 outline-none transition-all"
            />
         </div>
         <select 
           value={recFilter}
           onChange={e => { setRecFilter(e.target.value); setCurrentPage(1); }}
           className="w-full lg:w-56 px-4 py-2.5 bg-[#F8F9FB] border border-transparent rounded-xl text-[14px] font-bold text-[#5A6474] outline-none cursor-pointer hover:bg-[#EEF0F2] transition-all"
         >
           <option value="all">All Recommendations</option>
           <option value="SHORTLIST">Shortlist Only</option>
           <option value="CONSIDER">Consider Only</option>
           <option value="DECLINE">Decline Only</option>
         </select>
         <div className="hidden lg:block h-6 w-[1px] bg-[#E8EAED]" />
         <span className="text-[12px] font-bold text-[#9BA5B4] uppercase px-2">{filteredCandidates.length} Results</span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => <ShimmerCard key={i} />)
        ) : paginatedCandidates.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E8EAED] rounded-3xl border-dashed">
            <p className="text-[#9BA5B4] font-medium">No candidates match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCandidates.map((c: any) => {
              const isExpanded = expandedId === c.applicantId;
              return (
                <div 
                  key={c.applicantId}
                  onClick={() => setExpandedId(isExpanded ? null : c.applicantId)}
                  className={classNames(
                    "rounded-2xl border border-[#E8EAED] p-6 bg-white cursor-pointer transition-all duration-200 relative overflow-hidden",
                    isExpanded ? "shadow-md ring-1 ring-[#2B71F0]/10" : "hover:shadow-sm"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[#F5F6FA] text-[#0F1621] font-bold flex items-center justify-center shrink-0 border border-[#E8EAED]">
                        {c.rank}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-bold text-[#0F1621] truncate">{getDisplayName(c)}</h3>
                        <p className="text-[13px] text-[#5A6474] truncate">{c.candidateHeadline || "No headline provided"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 self-start lg:self-auto lg:ml-auto">
                      <BiasIndicator biasFlags={c.biasFlags} />
                      <div className="h-8 w-[1px] bg-[#F5F6FA] hidden sm:block" />
                      <RecommendationBadge value={c.recommendation} />
                      <ScoreRing score={c.matchScore} size={48} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-8 pt-8 border-t border-[#F5F6FA] grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">AI Assessment</h4>
                              <p className="text-[15px] leading-relaxed text-[#5A6474] italic bg-[#F8F9FB] p-5 rounded-xl border border-[#E8EAED]">
                                "{c.reasoning}"
                              </p>
                            </div>
                            <div className="space-y-4">
                               <h4 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Score Breakdown</h4>
                               <BreakdownBars breakdown={c.scoreBreakdown} />
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Strengths</h4>
                              <div className="flex flex-wrap gap-2">
                                {(c.strengths || []).map((s: string, i: number) => (
                                  <span key={i} className="px-3 py-1 rounded-lg bg-[#F0FDF4] text-[#166534] text-[12px] font-medium border border-[#DCFCE7]">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Gaps</h4>
                              <div className="flex flex-wrap gap-2">
                                {(c.gaps || []).map((g: string, i: number) => (
                                  <span key={i} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-[12px] font-medium border border-red-100">{g}</span>
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

      <CandidateChatbot 
        jobId={jobId as string}
        jobTitle={currentJob?.title || "this job"}
        candidateCount={results?.shortlist?.length || 0}
        hasResults={!!results?.shortlist?.length}
      />
    </div>
  );
}
