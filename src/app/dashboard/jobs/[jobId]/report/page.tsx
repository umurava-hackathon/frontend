"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchResults, thunkFetchJob } from "@/store/slices/dashboardSlice";
import { ScoreRing } from "@/components/candidates/ScoreRing";
import { BreakdownBars } from "@/components/candidates/BreakdownBars";
import { RecommendationBadge } from "@/components/candidates/RecommendationBadge";
import { BiasIndicator } from "@/components/candidates/BiasIndicator";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const PDFDownloadButton = dynamic(
  () => import("@/components/reports/PDFDownloadButton"),
  { ssr: false, loading: () => <div className="h-10 w-32 bg-neutral-100 rounded-lg animate-pulse" /> }
);

function getDisplayName(c: any) {
  if (!c) return "Candidate";
  const { candidateName, firstName, lastName, name, fullName, email } = c;
  if (candidateName) return candidateName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || name || fullName || email || "Anonymous";
}

const ScoreGrid = ({ bd }: { bd: any }) => (
  <div className="grid grid-cols-2 gap-3">
    {[
      { label: "Skills", val: bd.skills },
      { label: "Experience", val: bd.experience },
      { label: "Education", val: bd.education },
      { label: "Relevance", val: bd.relevance }
    ].map((item) => (
      <div key={item.label} className="bg-white rounded-lg p-2.5 border border-[#E8EAED]">
        <div className="text-[9px] font-bold text-[#9BA5B4] uppercase tracking-wider mb-0.5">{item.label}</div>
        <div className="text-[13px] font-bold text-[#0F1621]">{item.val}%</div>
      </div>
    ))}
  </div>
);

export default function DetailedReportPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const results = useAppSelector((s) => s.dashboard.results);
  const currentJob = useAppSelector((s) => s.dashboard.currentJob);
  const loading = useAppSelector((s) => s.dashboard.loading);

  useEffect(() => {
    if (jobId) {
      void dispatch(thunkFetchResults(jobId) as any);
      void dispatch(thunkFetchJob(jobId) as any);
    }
  }, [jobId, dispatch]);

  if (loading) return <div className="p-20 text-center text-[#9BA5B4] font-bold uppercase tracking-widest animate-pulse">Generating Report...</div>;
  if (!results) return <div className="p-20 text-center text-[#9BA5B4]">Report unavailable.</div>;

  const candidates = results.shortlist || [];

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-500 pb-24 font-jakarta">
      {/* Clean Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
           <div className="text-[#2B71F0] text-[11px] font-bold uppercase tracking-widest">Confidential Screening Report</div>
           <h1 className="text-3xl font-bold text-[#0F1621] tracking-tight">
              {currentJob?.title}
           </h1>
           <p className="text-sm text-[#5A6474] font-medium max-w-xl">
              Comparative analysis of the top {candidates.length} candidates identified in this campaign.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.back()}
             className="px-5 py-2.5 rounded-xl border border-[#E8EAED] text-[#5A6474] font-bold text-[13px] hover:bg-[#F8F9FB] transition-all"
           >
              Back
           </button>
           <PDFDownloadButton
             variant="full"
             jobTitle={currentJob?.title || "Shortlist Report"}
             jobId={jobId}
             runDate={new Date().toLocaleDateString()}
             status="succeeded"
             totalTopN={results.topN}
             candidates={candidates}
           />
        </div>
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-[#E8EAED] rounded-2xl p-6 space-y-4">
            <h3 className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">Scope</h3>
            <div className="flex justify-between items-end">
               <span className="text-sm font-medium text-[#5A6474]">Evaluated</span>
               <span className="text-2xl font-bold text-[#0F1621]">{results.candidateCount}</span>
            </div>
         </div>
         <div className="md:col-span-2 bg-[#F8F9FB] border border-[#E8EAED] rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
               <h3 className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">Decision Logic</h3>
               <p className="text-sm text-[#5A6474] italic leading-relaxed max-w-md">
                  Candidates ranked based on skill proficiency, years of relevant experience, and role alignment.
               </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white border-4 border-[#EEF4FF] flex items-center justify-center">
               <span className="text-lg font-bold text-[#2B71F0]">{candidates.length}</span>
            </div>
         </div>
      </div>

      {/* Simplified Matrix */}
      <div className="space-y-6">
         <h2 className="text-[11px] font-bold text-[#0F1621] uppercase tracking-[0.2em] border-l-4 border-[#2B71F0] pl-3">
            Top Talent Matrix
         </h2>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((c: any, idx: number) => (
               <div key={c.applicantId ?? idx} className="bg-white border border-[#E8EAED] rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 relative group">
                  <div className="absolute right-6 top-6 text-3xl font-black text-[#F5F6FA] group-hover:text-[#EEF4FF] transition-colors">#{c.rank}</div>
                  
                  <div className="space-y-6">
                     <div className="space-y-1.5">
                        <RecommendationBadge value={c.recommendation} />
                        <h3 className="text-xl font-bold text-[#0F1621]">{getDisplayName(c)}</h3>
                        <p className="text-[13px] text-[#9BA5B4] font-medium">{c.candidateHeadline || "Visionary Talent"}</p>
                     </div>

                     <div className="space-y-3">
                        <div className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">AI Synthesis</div>
                        <p className="text-[14px] text-[#5A6474] leading-relaxed italic border-l-2 border-[#F5F6FA] pl-4">
                           {c.reasoning.length > 200 ? c.reasoning.slice(0, 200) + "..." : c.reasoning}
                        </p>
                     </div>

                     <div className="space-y-3">
                        <div className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">Attributes</div>
                        <ScoreGrid bd={c.scoreBreakdown} />
                     </div>

                     <div className="pt-4 flex items-center justify-between border-t border-[#F5F6FA]">
                        <div className="flex items-center gap-3">
                           <span className="text-[13px] font-bold text-[#0F1621]">{c.matchScore}%</span>
                           <div className="h-1 w-12 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div className="h-full bg-[#2B71F0]" style={{ width: `${c.matchScore}%` }} />
                           </div>
                        </div>
                        <button 
                           onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist?a=${c.applicantId}`)}
                           className="text-[12px] font-bold text-[#2B71F0] hover:underline flex items-center gap-1"
                        >
                           Profile
                           <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Muted Footer */}
      <div className="pt-16 border-t border-[#E8EAED] text-center">
         <p className="text-[10px] text-[#9BA5B4] font-bold uppercase tracking-[0.2em]">Umurava Intelligence Engine</p>
         <p className="text-[10px] text-[#9BA5B4] mt-1">Generated {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
