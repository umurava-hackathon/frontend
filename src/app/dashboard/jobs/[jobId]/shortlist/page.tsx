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
  <div className="h-[120px] rounded-xl border border-neutral-100 bg-white animate-pulse flex items-center px-6 gap-6">
    <div className="h-10 w-10 rounded-full bg-neutral-50" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-neutral-50 rounded w-1/3" />
      <div className="h-3 bg-neutral-50 rounded w-1/4" />
    </div>
    <div className="h-8 w-24 bg-neutral-50 rounded-full" />
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
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621]">Ranked Shortlist</h1>
          <p className="text-sm text-[#5A6474]">AI-powered ranking based on your defined requirements and weights.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {currentJob && !currentJob.isScreened && (
             <button
               type="button"
               onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/ingest`)}
               className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2B71F0] text-white rounded-lg text-sm font-bold hover:bg-[#1A5CE0] transition-all shadow-sm flex items-center justify-center gap-2"
             >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Continue Ingestion
             </button>
          )}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#EEF4FF] text-[#2B71F0] rounded-lg text-sm font-bold hover:bg-[#DDE9FF] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Compare Mode
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/report`)}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-[#E8EAED] text-[#5A6474] rounded-lg text-sm font-bold hover:bg-[#F8F9FC] transition-all shadow-sm"
          >
            View Full Report
          </button>
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

      {/* Filters Bar */}
      <div className="bg-white border border-[#E8EAED] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Filter by candidate name..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-[#F8F9FC] border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none"
            />
         </div>
         <select 
           value={recFilter}
           onChange={e => { setRecFilter(e.target.value); setCurrentPage(1); }}
           className="w-full sm:w-48 px-4 py-2 bg-[#F8F9FC] border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none font-medium"
         >
           <option value="all">All Recommendations</option>
           <option value="SHORTLIST">Shortlist Only</option>
           <option value="CONSIDER">Consider Only</option>
           <option value="DECLINE">Decline Only</option>
         </select>
         <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest px-2 whitespace-nowrap">
            {filteredCandidates.length} Found
         </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => <ShimmerCard key={i} />)
        ) : paginatedCandidates.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E8EAED] rounded-xl border-dashed">
            <p className="text-[#5A6474]">No candidates match your current filters.</p>
          </div>
        ) : (
          paginatedCandidates.map((c: any) => {
            const isExpanded = expandedId === c.applicantId;
            return (
              <div 
                key={c.applicantId}
                onClick={() => setExpandedId(isExpanded ? null : c.applicantId)}
                className={classNames(
                  "rounded-xl border border-[#E8EAED] p-6 bg-white cursor-pointer transition-all duration-300 relative overflow-hidden",
                  "border-l-[4px] border-l-[#2B71F0]",
                  isExpanded ? "shadow-md ring-1 ring-[#2B71F0]/10" : "shadow-sm hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#F5F6FA] text-[#0F1621] font-bold flex items-center justify-center shrink-0 border border-[#E8EAED]">
                      {c.rank}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-bold text-[#0F1621] truncate">{getDisplayName(c)}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[13px] text-[#5A6474] truncate">{c.candidateHeadline || "No headline provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto">
                    <div className="flex flex-col items-end gap-1.5">
                      <BiasIndicator biasFlags={c.biasFlags} />
                      <div className="flex gap-2">
                        {c.resumeParsed ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#059669] text-[9px] font-bold uppercase tracking-tight border border-[#10B981] flex items-center gap-1">
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            Resume Parsed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#F5F6FA] text-[#5A6474] text-[9px] font-bold uppercase tracking-tight border border-[#E8EAED]">
                            CSV Data Only
                          </span>
                        )}
                      </div>
                    </div>
                    <RecommendationBadge value={c.recommendation} />
                    <ScoreRing score={c.matchScore} size={48} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-8 pt-8 border-t border-[#F5F6FA] grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Score Breakdown</div>
                        <BreakdownBars breakdown={c.scoreBreakdown} />
                        
                        <div className="pt-4 flex flex-col gap-2 border-t border-[#F5F6FA]">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-[#5A6474] font-medium">AI Confidence</span>
                            <span className={`font-bold ${c.confidence >= 0.7 ? "text-[#10B981]" : c.confidence >= 0.5 ? "text-amber-500" : "text-[#9BA5B4]"}`}>
                              {Math.round(c.confidence * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-[#5A6474] font-medium">Data Source</span>
                            <span className="font-bold text-[#0F1621] uppercase tracking-tight">
                              {c.dataSource?.replace("_", " ") ?? "External CSV"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">AI Reasoning</div>
                        <p className="text-[14px] leading-relaxed text-[#5A6474] italic bg-[#F8F9FC] p-4 rounded-lg border border-[#E8EAED]">
                          "{c.reasoning}"
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Top Strengths</div>
                        <div className="flex flex-wrap gap-2">
                          {(c.strengths || []).map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-[#F0FDF4] text-[#166534] text-[12px] font-medium border border-[#86EFAC]">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Key Gaps</div>
                        <div className="flex flex-wrap gap-2">
                          {(c.gaps || []).map((g: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium border border-red-100">{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="bg-white border border-[#E8EAED] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm bg-[#F8F9FC]">
           <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-wider">Show</span>
              <select 
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-[#E8EAED] rounded px-2 py-1.5 text-xs font-bold text-[#5A6474] outline-none focus:border-[#2B71F0]"
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
               className="px-6 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
             >
               Previous
             </button>
             <div className="hidden md:flex gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={classNames(
                      "w-10 h-10 rounded-lg text-sm font-bold transition-all",
                      currentPage === p ? "bg-[#2B71F0] text-white" : "text-[#5A6474] hover:bg-white hover:text-[#2B71F0]"
                    )}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 5 && <span className="flex items-end pb-2 px-1 text-[#9BA5B4]">...</span>}
             </div>
             <span className="md:hidden text-xs font-bold text-[#9BA5B4]">Page {currentPage} of {totalPages}</span>
             <button 
               disabled={currentPage === totalPages || totalPages === 0}
               onClick={() => setCurrentPage(p => p + 1)}
               className="px-6 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
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
