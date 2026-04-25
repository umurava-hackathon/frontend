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

  const isMixedSource = useMemo(() => {
    if (selectedCandidates.length !== 2) return false;
    const c1 = selectedCandidates[0];
    const c2 = selectedCandidates[1];
    return !!c1._resumeParsed !== !!c2._resumeParsed;
  }, [selectedCandidates]);

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
          <h1 className="text-2xl font-semibold text-neutral-800">Comparison mode</h1>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            Select exactly two candidates to compare strengths, gaps and score dimensions side-by-side.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
          className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring"
        >
          Back to shortlist
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="text-[13px] font-medium uppercase tracking-widest text-neutral-500">Pick two candidates</div>
          <div className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary-50 text-primary-500 border border-primary-100">
            {selected.length} / 2 selected
          </div>
        </div>
        
        {shortlist.length === 0 ? (
          <div className="text-sm text-neutral-400 py-12 text-center italic">No candidates available for comparison.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortlist.map((c: any) => {
              const checked = selected.includes(c.applicantId);
              const isTop3 = c.rank <= 3;
              return (
                <div
                  key={c.applicantId}
                  className={classNames(
                    "rounded-xl border p-4 cursor-pointer transition-card select-none",
                    checked 
                      ? "border-primary-500 bg-primary-50/30 ring-1 ring-primary-500" 
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                  )}
                  onClick={() => toggleCandidate(c.applicantId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={classNames(
                        "h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full text-[12px] font-bold border transition-card",
                        checked ? "bg-primary-500 text-white border-primary-500" : isTop3 ? "bg-neutral-800 text-white border-neutral-800 shadow-sm" : "bg-neutral-50 text-neutral-500 border-neutral-200"
                      )}>
                        {c.rank}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-neutral-800 truncate">{c.fullName || `Candidate ${c.applicantId.slice(-4)}`}</div>
                        {c.candidateHeadline ? <div className="text-[12px] text-neutral-500 truncate mt-0.5">{c.candidateHeadline}</div> : null}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className={classNames(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150",
                        checked ? "bg-primary-500 border-primary-500 shadow-sm" : "bg-white border-neutral-300"
                      )}>
                        {checked && (
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
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

      {isMixedSource && (
        <div className="mx-4 sm:mx-0 p-4 bg-[#FEF9C3] border border-[#FDE047] rounded-lg animate-fade-in-up">
          <div className="flex items-center gap-3 text-[#D97706]">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[13px] font-medium leading-relaxed">
              Note: Candidate #1 was scored from a parsed resume while Candidate #2 is CSV-only. Score dimensions may not be directly comparable.
            </p>
          </div>
        </div>
      )}

      <div className={classNames(
        "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-350 ease-out",
        selectedCandidates.length === 0 ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      )}>
        {selectedCandidates.map((c: any, idx: number) => (
          <div key={c.applicantId} className="bg-white rounded-xl shadow-card border border-neutral-200 p-6 sm:p-8 space-y-8 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-6">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-widest text-primary-500 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 inline-block mb-2">
                  Selected Candidate #{idx + 1}
                </div>
                <div className="text-xl font-bold text-neutral-800">{c.fullName || `Candidate ${c.applicantId.slice(-4)}`}</div>
                <div className="flex items-center gap-2">
                  <div className="text-[13px] text-neutral-500 font-medium">{c.candidateHeadline || "No headline provided"}</div>
                  {/* Data Quality Badge */}
                  {c._resumeParsed ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[9px] font-bold uppercase tracking-wider">
                      Resume parsed
                    </div>
                  ) : c._resumeParseError ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] text-[9px] font-bold uppercase tracking-wider">
                      Resume unavailable
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] text-[9px] font-bold uppercase tracking-wider">
                      CSV profile
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Match</div>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-3xl font-bold text-neutral-800">{c.matchScore}</span>
                  <span className="text-xs font-bold text-neutral-400">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Score dimensions</div>
              <BreakdownBars breakdown={c.scoreBreakdown} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-neutral-50">
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Top strengths</div>
                <div className="flex flex-col gap-2">
                  {(c.strengths ?? []).slice(0, 3).map((s: string) => (
                    <span key={s} className="px-3 py-1.5 bg-successLight text-success border border-success/20 rounded-lg text-[13px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Key Gaps</div>
                <div className="flex flex-col gap-2">
                  {(c.gaps ?? []).slice(0, 3).map((s: string) => (
                    <span key={s} className="px-3 py-1.5 bg-warningLight text-warning border border-warning/20 rounded-lg text-[13px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">AI reasoning</div>
                <button
                  type="button"
                  onClick={() => setExpandedReasoning((prev) => (prev === c.applicantId ? null : c.applicantId))}
                  className="text-xs text-primary-500 font-bold hover:underline"
                >
                  {expandedReasoning === c.applicantId ? "Hide rationale" : "Show rationale"}
                </button>
              </div>
              <div className={classNames("expandable-grid", expandedReasoning === c.applicantId && "expanded")}>
                <div className="expandable-content">
                  <p className="text-[14px] leading-[1.7] text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-4 italic">
                    {c.reasoning}
                  </p>
                </div>
              </div>
              {expandedReasoning !== c.applicantId && (
                <div className="text-[12px] text-neutral-400 italic">Recruiter-friendly rationale hidden. Click show to expand.</div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-6 border-t border-neutral-100">
              <RecommendationBadge value={c.recommendation} />
              <BiasIndicator biasFlags={c.biasFlags} />
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest ml-auto">
                Confidence:{" "}
                <span className="text-neutral-800 ml-1">{typeof c.confidence === "number" ? `${Math.round(c.confidence * 100)}%` : "—"}</span>
              </div>
            </div>
          </div>
        ))}

        {selectedCandidates.length < 2 && (
          <div className={classNames(
            "bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 p-16 text-center flex flex-col items-center justify-center space-y-4",
            selectedCandidates.length === 1 ? "hidden lg:flex" : "hidden"
          )}>
            <div className="h-16 w-16 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-neutral-300 shadow-sm">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">Select second candidate</h3>
              <p className="text-xs text-neutral-400">Pick another one above to compare side-by-side.</p>
            </div>
          </div>
        )}
      </div>
      
      {selectedCandidates.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-20 text-center shadow-sm">
           <div className="max-w-xs mx-auto space-y-6">
              <div className="flex justify-center -space-x-4">
                 <div className="h-14 w-14 rounded-full bg-neutral-100 border-2 border-white shadow-sm" />
                 <div className="h-14 w-14 rounded-full bg-neutral-200 border-2 border-white shadow-sm" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-800">Ready to compare?</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Pick two candidates from your shortlist above to see how they stack up side-by-side.</p>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
