"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchResults } from "@/store/slices/dashboardSlice";
import { ScoreRing } from "@/components/candidates/ScoreRing";
import { BreakdownBars } from "@/components/candidates/BreakdownBars";
import { RecommendationBadge } from "@/components/candidates/RecommendationBadge";
import { BiasIndicator } from "@/components/candidates/BiasIndicator";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { candidateName, firstName, lastName, name, fullName, email, applicantId } = c;
  
  if (candidateName) return candidateName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return (
    firstName ||
    lastName ||
    name ||
    fullName ||
    email ||
    `Candidate ${applicantId?.slice(-4) || "????"}`
  );
}

export default function ComparePage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);
  const loading = useAppSelector((s) => s.dashboard.loading);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
  }, [jobId, dispatch]);

  const candidates = useMemo(() => {
    return (results?.shortlist ?? []).map((c: any) => ({
      ...c,
      matchScore: Number(c.matchScore)
    }));
  }, [results?.shortlist]);

  const selectedCandidates = useMemo(() => {
    return selectedIds.map(id => candidates.find((c: any) => c.applicantId === id)).filter(Boolean);
  }, [selectedIds, candidates]);

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621]">Candidate Comparison</h1>
          <p className="text-sm text-[#5A6474]">Select two candidates to analyze their scores side-by-side.</p>
        </div>
        <button 
          onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist`)}
          className="text-sm font-semibold text-[#2B71F0] hover:underline"
        >
          ← Back to shortlist
        </button>
      </div>

      {/* Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c: any) => {
          const checked = selectedIds.includes(c.applicantId);
          return (
            <div 
              key={c.applicantId}
              onClick={() => toggleCandidate(c.applicantId)}
              className={classNames(
                "rounded-xl border p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                checked 
                  ? "border-[#2B71F0] bg-[#EEF4FF] ring-1 ring-[#2B71F0]" 
                  : "border-[#E8EAED] bg-white hover:border-[#2B71F0] hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={classNames(
                  "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                  checked ? "bg-[#2B71F0] border-[#2B71F0]" : "border-[#CBD5E1] bg-white group-hover:border-[#2B71F0]"
                )}>
                  {checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-[#0F1621] truncate">{getDisplayName(c)}</div>
                  <div className="text-[12px] text-[#5A6474] font-medium truncate mt-0.5">{c.matchScore}% Match</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      {/* Comparison View */}
      {selectedCandidates.length === 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {selectedCandidates.map((c: any, idx) => (
            <div key={c.applicantId} className="bg-white border border-[#E8EAED] rounded-xl p-8 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-start justify-between gap-4 border-b border-[#F5F6FA] pb-6">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-[#0F1621]">{getDisplayName(c)}</div>
                  <div className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-widest">
                    Selected Candidate #{idx + 1}
                  </div>
                  <div className="text-[13px] text-[#5A6474] font-medium pt-2 line-clamp-1">{c.candidateHeadline || "No headline provided"}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RecommendationBadge value={c.recommendation} />
                  <ScoreRing score={c.matchScore} size={52} />
                </div>
              </div>

              <div className="py-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Match Breakdown</h3>
                  <BreakdownBars breakdown={c.scoreBreakdown} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Top Strengths</h3>
                    <div className="flex flex-wrap gap-2">
                      {(c.strengths ?? []).slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-[#F0FDF4] text-[#166534] text-[12px] font-semibold border border-[#86EFAC]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">Key Gaps</h3>
                    <div className="flex flex-wrap gap-2">
                      {(c.gaps ?? []).slice(0, 3).map((g: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#5A6474] text-[12px] font-semibold border border-[#E8EAED]">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#F5F6FA]">
                  <h3 className="text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">AI Reasoning</h3>
                  <p className="text-[14px] leading-[1.7] text-[#5A6474] italic">
                    "{c.reasoning}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E8EAED] border-dashed rounded-xl p-20 text-center shadow-sm">
           <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="h-16 w-16 rounded-full bg-[#F5F6FA] flex items-center justify-center text-[#9BA5B4]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0F1621]">Select two candidates</h3>
                <p className="text-sm text-[#5A6474] leading-relaxed">Choose two candidates from the list above to see their side-by-side AI analysis.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
