"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchResults } from "@/store/slices/dashboardSlice";
import { ScoreRing } from "@/components/candidates/ScoreRing";
import { GreenPill, AmberPill } from "@/components/candidates/Pills";
import { RecommendationBadge } from "@/components/candidates/RecommendationBadge";
import { BreakdownBars } from "@/components/candidates/BreakdownBars";
import { BiasIndicator } from "@/components/candidates/BiasIndicator";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ShimmerCard = () => (
  <div className="rounded-2xl border border-gray-100 p-6 bg-white space-y-4">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full animate-shimmer bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 animate-shimmer bg-gray-100 rounded" />
        <div className="h-3 w-1/2 animate-shimmer bg-gray-100 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-20 animate-shimmer bg-gray-100 rounded-xl" />
      <div className="h-20 animate-shimmer bg-gray-100 rounded-xl" />
    </div>
  </div>
);

export default function ShortlistPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);
  const loading = useAppSelector((s) => s.dashboard.loading);
  const screeningError = useAppSelector((s) => s.dashboard.screening.error);

  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
  }, [jobId, dispatch]);

  const shortlist = results?.shortlist ?? [];

  const candidateCards = useMemo(() => {
    return shortlist.map((c: any) => ({
      ...c,
      matchScore: Number(c.matchScore),
      confidence: typeof c.confidence === "number" ? c.confidence : undefined
    }));
  }, [shortlist]);

  if (loading && (!results || results.jobId !== jobId)) {
    return (
      <section className="space-y-6 animate-fade-in-up">
        <div className="space-y-2 px-4 sm:px-0 text-center sm:text-left">
          <div className="h-8 w-48 bg-gray-200 animate-shimmer rounded-lg mx-auto sm:mx-0" />
          <div className="h-4 w-64 bg-gray-100 animate-shimmer rounded mx-auto sm:mx-0" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 animate-fade-in-up">
      {screeningError && (
        <div className="mx-4 sm:mx-0 p-4 bg-dangerLight border border-danger/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center gap-3 text-danger">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">Screening failed: {screeningError}</span>
          </div>
          <button 
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="text-xs font-bold uppercase tracking-widest bg-white px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-800 border border-neutral-200 focus-ring"
          >
            Retry screening
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-neutral-800">Shortlist</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ranked candidates with transparent strengths, gaps and AI bias awareness.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring"
          >
            Compare mode
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
          >
            Run again
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 mx-4 sm:mx-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 font-medium">Run status:</span>
            <span className="px-3 py-1 bg-successLight text-success border border-success/20 rounded-full text-[11px] font-bold uppercase tracking-widest">
              {results?.status ?? "unknown"}
            </span>
          </div>
          <div className="text-[13px] font-medium text-neutral-500">
            Showing Top <span className="text-neutral-800 font-bold">{results?.topN ?? "?"}</span> candidates.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
        {candidateCards.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-sm">
            <div className="text-neutral-300">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-800">No shortlist results yet</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">Run screening to see ranked AI recommendations here.</p>
            </div>
            <button
               onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
               className="px-8 py-3 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
            >
              Start screening
            </button>
          </div>
        ) : (
          candidateCards.map((c: any, index: number) => {
            const isTop3 = c.rank <= 3;
            const isExpanded = expandedCandidateId === c.applicantId;
            const leftBorder = c.recommendation === "SHORTLIST" ? "border-l-success" : c.recommendation === "CONSIDER" ? "border-l-warning" : "border-l-danger";

            return (
              <div
                key={c.applicantId}
                style={{ animationDelay: `${index * 80}ms` }}
                className={classNames(
                  "rounded-xl border border-neutral-200 p-5 sm:p-6 bg-white cursor-pointer transition-card animate-fade-in-up relative overflow-hidden border-l-[3px]",
                  leftBorder,
                  isExpanded ? "shadow-md ring-1 ring-primary-500/10" : "shadow-sm hover:shadow-card hover:-translate-y-[1px]"
                )}
                onClick={() => setExpandedCandidateId((prev) => (prev === c.applicantId ? null : c.applicantId))}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={classNames(
                      "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold shadow-sm shrink-0",
                      c.rank === 1 ? "bg-primary-500 text-white" : "bg-neutral-800 text-white"
                    )}>
                      {c.rank}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-semibold text-neutral-800 truncate">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</h3>
                      <p className="text-[13px] text-neutral-500 font-medium truncate mt-0.5">{c.candidateHeadline || "No headline provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto">
                    <BiasIndicator biasFlags={c.biasFlags} />
                    <RecommendationBadge value={c.recommendation} />
                    <ScoreRing score={c.matchScore} size={48} />
                  </div>
                </div>

                <div className={classNames(
                  "mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-neutral-100 transition-all duration-300",
                  isExpanded ? "opacity-100" : "opacity-0 h-0 mt-0 pt-0 overflow-hidden"
                )}>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-0.5">Match Breakdown</div>
                      <BreakdownBars breakdown={c.scoreBreakdown} />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-0.5">Top Strengths</div>
                        <div className="flex flex-wrap gap-2">
                          {(c.strengths ?? []).slice(0, 3).map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-successLight text-success border border-success/20 rounded-full text-[12px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-0.5">Key Gaps</div>
                        <div className="flex flex-wrap gap-2">
                          {(c.gaps ?? []).slice(0, 3).map((g: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-warningLight text-warning border border-warning/20 rounded-full text-[12px] font-medium">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-0.5">AI Reasoning</div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 sm:p-5">
                      <p className="text-[14px] leading-[1.7] text-neutral-600">
                        {c.reasoning}
                      </p>
                    </div>
                  </div>
                </div>

                {!isExpanded && (
                  <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-primary-500">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary-500" /> {c.scoreBreakdown?.skills ?? 0}% Skills</span>
                      <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary-500" /> {c.scoreBreakdown?.experience ?? 0}% Experience</span>
                    </div>
                    <span className="flex items-center gap-1">
                      View details
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
