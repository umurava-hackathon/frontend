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

export default function ComparePage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);

  const shortlist = results?.shortlist ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
  }, [jobId, dispatch]);

  const selectedCandidates = useMemo(() => {
    const map = new Map(shortlist.map((c: any) => [c.applicantId, c]));
    return selected.map((id) => map.get(id)).filter(Boolean);
  }, [shortlist, selected]);

  function toggleCandidate(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="flex-1">
          <h1 className="page-title">Comparison mode</h1>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Select exactly two candidates to compare strengths, gaps and score dimensions side-by-side.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
          className="w-full sm:w-auto rounded-xl px-6 py-3 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-card shadow-sm font-medium focus-ring"
        >
          Back to shortlist
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:shadow-soft border-y sm:border border-gray-200 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Step 1: Pick two candidates</div>
          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {selected.length} / 2 selected
          </div>
        </div>
        
        {shortlist.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center italic">No candidates available for comparison.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortlist.map((c: any) => {
              const checked = selected.includes(c.applicantId);
              const isTop3 = c.rank <= 3;
              return (
                <div
                  key={c.applicantId}
                  className={classNames(
                    "rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none",
                    checked 
                      ? "border-green-500 bg-green-50/30 ring-1 ring-green-500" 
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-soft"
                  )}
                  onClick={() => toggleCandidate(c.applicantId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-11 w-11 flex-shrink-0">
                        <div className={classNames(
                          "absolute inset-0 flex items-center justify-center rounded-full text-sm font-bold border transition-card",
                          checked ? "bg-green-600 text-white border-green-600" : isTop3 ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-gray-100 text-gray-900 border-gray-200"
                        )}>
                          {c.rank}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="candidate-name truncate">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</div>
                        {c.candidateHeadline ? <div className="candidate-headline truncate mt-0.5">{c.candidateHeadline}</div> : null}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className={classNames(
                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150",
                        checked ? "bg-green-600 border-green-600" : "bg-white border-gray-300"
                      )}>
                        {checked && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <ScoreRing score={Number(c.matchScore)} size={36} />
                    <RecommendationBadge value={c.recommendation} />
                    <BiasIndicator biasFlags={c.biasFlags} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={classNames(
        "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-350 ease-out",
        selectedCandidates.length === 0 ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      )}>
        {selectedCandidates.map((c: any, idx: number) => (
          <div key={c.applicantId} className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 space-y-6 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  Selected Candidate #{idx + 1}
                </div>
                <div className="text-xl font-bold text-gray-900">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</div>
                {c.candidateHeadline ? <div className="candidate-headline">{c.candidateHeadline}</div> : null}
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Match</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#1F2A37]">{c.matchScore}</span>
                  <span className="text-xs font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="section-label">Score dimensions</div>
              <BreakdownBars breakdown={c.scoreBreakdown} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-y border-gray-50">
              <div className="space-y-3">
                <div className="section-label">Top strengths</div>
                <div className="flex flex-col gap-2">
                  {(c.strengths ?? []).slice(0, 3).map((s: string) => (
                    <GreenPill key={s}>{s}</GreenPill>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="section-label">Gaps / risks</div>
                <div className="flex flex-col gap-2">
                  {(c.gaps ?? []).slice(0, 3).map((s: string) => (
                    <AmberPill key={s}>{s}</AmberPill>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="section-label">AI reasoning</div>
                <button
                  type="button"
                  onClick={() => setExpandedReasoning((prev) => (prev === c.applicantId ? null : c.applicantId))}
                  className="text-xs text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-1 rounded-full transition-card"
                >
                  {expandedReasoning === c.applicantId ? "Hide rationale" : "Show rationale"}
                </button>
              </div>
              <div className={classNames("expandable-grid", expandedReasoning === c.applicantId && "expanded")}>
                <div className="expandable-content">
                  <p className="ai-reasoning bg-gray-50/50 p-4 rounded-xl border border-gray-100 italic">
                    {c.reasoning}
                  </p>
                </div>
              </div>
              {expandedReasoning !== c.applicantId && (
                <div className="text-xs text-gray-400 italic">Recruiter-friendly rationale hidden. Click show to expand.</div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-gray-100">
              <RecommendationBadge value={c.recommendation} />
              <BiasIndicator biasFlags={c.biasFlags} />
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-auto">
                Confidence:{" "}
                <span className="text-gray-900 ml-1">{typeof c.confidence === "number" ? `${Math.round(c.confidence * 100)}%` : "—"}</span>
              </div>
            </div>
          </div>
        ))}

        {selectedCandidates.length < 2 && (
          <div className={classNames(
            "bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center space-y-4",
            selectedCandidates.length === 1 ? "hidden lg:flex" : "hidden"
          )}>
            <div className="h-16 w-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Select second candidate</h3>
              <p className="text-xs text-gray-500">Pick another one above to compare side-by-side.</p>
            </div>
          </div>
        )}
      </div>
      
      {selectedCandidates.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-soft">
           <div className="max-w-xs mx-auto space-y-4">
              <div className="flex justify-center -space-x-4">
                 <div className="h-12 w-12 rounded-full bg-gray-100 border-2 border-white" />
                 <div className="h-12 w-12 rounded-full bg-gray-200 border-2 border-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Ready to compare?</h3>
                <p className="text-sm text-gray-500">Pick two candidates from your shortlist above to see how they stack up.</p>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
