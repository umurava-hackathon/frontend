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
    <section className="space-y-6 animate-fade-in-up">
      {screeningError && (
        <div className="mx-4 sm:mx-0 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center gap-3 text-red-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">Screening failed: {screeningError}</span>
          </div>
          <button 
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="text-xs font-bold uppercase tracking-widest bg-red-100 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-red-900 focus-ring"
          >
            Retry screening
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <h1 className="page-title">Shortlist</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ranked candidates with transparent strengths, gaps and AI bias awareness.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="w-full sm:w-auto rounded-xl px-6 py-2.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-card shadow-sm font-medium focus-ring"
          >
            Compare mode
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="w-full sm:w-auto rounded-xl px-6 py-2.5 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card shadow-sm font-medium focus-ring"
          >
            Run again
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mx-4 sm:mx-0 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Run status: <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] ml-2">{results?.status ?? "unknown"}</span>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            Showing Top {results?.topN ?? "?"} candidates.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
        {candidateCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center space-y-4">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">No shortlist results yet</h3>
              <p className="text-sm text-gray-500">Run screening to see ranked AI recommendations here.</p>
            </div>
            <button
               onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
               className="rounded-xl px-6 py-2.5 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card focus-ring"
            >
              Start screening
            </button>
          </div>
        ) : (
          candidateCards.map((c: any, index: number) => {
            const isTop3 = c.rank <= 3;
            const isExpanded = expandedCandidateId === c.applicantId;
            const leftBorder = c.recommendation === "SHORTLIST" ? "border-l-[4px] border-l-green-500" : c.recommendation === "CONSIDER" ? "border-l-[4px] border-l-amber-500" : "border-l-[4px] border-l-red-500";

            return (
              <div
                key={c.applicantId}
                style={{ animationDelay: `${index * 80}ms` }}
                className={classNames(
                  "rounded-2xl border border-gray-200 p-4 sm:p-6 bg-white cursor-pointer transition-card card-hover animate-fade-in-up relative overflow-hidden focus-ring",
                  leftBorder,
                  isExpanded ? "shadow-md" : "shadow-soft"
                )}
                onClick={() => setExpandedCandidateId((prev) => (prev === c.applicantId ? null : c.applicantId))}
                role="button"
                tabIndex={0}
              >
                {/* Score ring absolute on mobile */}
                <div className="sm:hidden absolute top-4 right-4 scale-90">
                  <ScoreRing score={c.matchScore} size={48} />
                </div>

                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="hidden sm:flex items-center justify-center">
                       <div className={classNames(
                          "flex items-center justify-center rounded-full h-10 w-10 text-sm font-bold border transition-card",
                          isTop3 ? "bg-[#1F2A37] text-white border-[#1F2A37] shadow-soft" : "bg-gray-50 text-gray-900 border-gray-200"
                        )}>
                        {c.rank}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                      <div className="hidden sm:block">
                        <ScoreRing score={c.matchScore} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           <span className="sm:hidden font-bold text-[#1F2A37]">#{c.rank}</span>
                           <h2 className="candidate-name">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</h2>
                        </div>
                        {c.candidateHeadline ? <p className="candidate-headline">{c.candidateHeadline}</p> : null}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <RecommendationBadge value={c.recommendation} />
                          <BiasIndicator biasFlags={c.biasFlags} />
                        </div>
                        <div className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                          AI Confidence: 
                          <span className="text-gray-900 font-bold">
                            {typeof c.confidence === "number" ? `${Math.round(c.confidence * 100)}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <div className="text-xl font-bold text-gray-900">{Math.round(c.matchScore)}</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Match score</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="section-label">Top strengths</div>
                    <div className="flex flex-wrap gap-2">
                      {(c.strengths ?? []).slice(0, 3).map((s: string) => (
                        <GreenPill key={s}>{s}</GreenPill>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="section-label">Gaps / risks</div>
                    <div className="flex flex-wrap gap-2">
                      {(c.gaps ?? []).slice(0, 3).map((s: string) => (
                        <AmberPill key={s}>{s}</AmberPill>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={classNames("expandable-grid mt-4", isExpanded && "expanded")}>
                  <div className="expandable-content border-t border-gray-100 pt-6 space-y-6">
                    <div className="space-y-3">
                      <div className="section-label">AI reasoning</div>
                      <p className="ai-reasoning bg-gray-50/50 p-4 rounded-xl border border-gray-100 italic">
                        {c.reasoning}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="section-label">Score breakdown</div>
                      <BreakdownBars breakdown={c.scoreBreakdown} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:hidden text-center">
                  <span className="text-xs font-bold text-blue-600">
                    {isExpanded ? "Click to collapse" : "Click to view reasoning"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
