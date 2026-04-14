"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchJob, thunkFetchResults } from "@/store/slices/dashboardSlice";
import { ScoreRing } from "@/components/candidates/ScoreRing";
import { GreenPill, AmberPill } from "@/components/candidates/Pills";
import { RecommendationBadge } from "@/components/candidates/RecommendationBadge";
import { BreakdownBars } from "@/components/candidates/BreakdownBars";
import { BiasIndicator } from "@/components/candidates/BiasIndicator";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ShimmerCard = () => (
  <div className="rounded-2xl border border-neutral-100 p-6 bg-white space-y-4">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full animate-shimmer bg-neutral-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 animate-shimmer bg-neutral-100 rounded" />
        <div className="h-3 w-1/2 animate-shimmer bg-neutral-100 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-20 animate-shimmer bg-neutral-100 rounded-xl" />
      <div className="h-20 animate-shimmer bg-neutral-100 rounded-xl" />
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
  const [pollTick, setPollTick] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const currentJob = useAppSelector((s) => s.dashboard.currentJob);

  const isPolling = results?.status === "queued" || results?.status === "running";

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
    void dispatch(thunkFetchJob(jobId) as any);
  }, [jobId, dispatch, pollTick]);

  // Re-poll every 3 s while screening is in-flight
  useEffect(() => {
    if (!isPolling) return;
    const t = setTimeout(() => setPollTick((n) => n + 1), 3000);
    return () => clearTimeout(t);
  }, [isPolling, pollTick]);

  // Animate fake progress bar while polling
  useEffect(() => {
    if (isPolling) {
      setFakeProgress((p) => Math.max(15, p));
      const t = setInterval(
        () => setFakeProgress((p) => Math.min(80, p + Math.random() * 3 + 0.5)),
        900
      );
      return () => clearInterval(t);
    }
    if (results?.status === "succeeded" || results?.status === "partial") setFakeProgress(100);
    if (results?.status === "failed") setFakeProgress(100);
  }, [isPolling, results?.status]);

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
          <div className="h-8 w-48 bg-neutral-200 animate-shimmer rounded-lg mx-auto sm:mx-0" />
          <div className="h-4 w-64 bg-neutral-100 animate-shimmer rounded mx-auto sm:mx-0" />
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

      {(results?.errors ?? []).some((e) => e.code === "GEMINI_FAILURE") && (
        <div className="mx-4 sm:mx-0 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI model unavailable — results are heuristic estimates
          </div>
          <p className="text-xs text-amber-600 leading-relaxed">
            {(results?.errors ?? []).find((e) => e.code === "GEMINI_FAILURE")?.message ?? "Gemini scoring failed"}
            {" "}— scores, strengths and reasoning were generated by the keyword heuristic fallback and may be less accurate. Re-run screening once the model is available.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-neutral-800">Shortlist</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ranked candidates with transparent strengths, gaps and AI bias awareness.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <Link
            href={`/dashboard/jobs/${encodeURIComponent(jobId)}/edit`}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring text-center"
          >
            Edit job
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring"
          >
            Compare mode
          </button>
          <button
            type="button"
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
            onClick={() => window.open(`/dashboard/jobs/${encodeURIComponent(jobId)}/report`, "_blank")}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring inline-flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View report
          </button>
          <button
            type="button"
>>>>>>> Stashed changes
=======
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm focus-ring inline-flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print report
          </button>
          <button
            type="button"
>>>>>>> frontend/npk
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
          >
            Run again
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 mx-4 sm:mx-0 shadow-sm no-print">
        {isPolling ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
                <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                AI screening in progress…
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                {results?.status}
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_6px_rgba(43,113,240,0.35)]"
                style={{ width: `${fakeProgress}%` }}
              />
            </div>
            <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest select-none">
              {[
                { label: "Queued",    active: results?.status === "queued" },
                { label: "Analyzing", active: results?.status === "running" && fakeProgress < 55 },
                { label: "Ranking",   active: results?.status === "running" && fakeProgress >= 55 },
                { label: "Complete",  active: false },
              ].map((s, i) => (
                <span key={i} className={s.active ? "text-primary-500" : "text-neutral-300"}>{s.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500 font-medium">Run status:</span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${
                results?.status === "succeeded" ? "bg-successLight text-success border-success/20" :
                results?.status === "partial"   ? "bg-warningLight text-warning border-warning/20" :
                results?.status === "failed"    ? "bg-dangerLight text-danger border-danger/20" :
                "bg-neutral-100 text-neutral-500 border-neutral-200"
              }`}>
                {results?.status ?? "unknown"}
              </span>
            </div>
            <div className="text-[13px] font-medium text-neutral-500">
              Showing Top <span className="text-neutral-800 font-bold">{results?.topN ?? "?"}</span> candidates.
            </div>
          </div>
        )}
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

            return (
              <div
                key={c.applicantId}
                style={{ animationDelay: `${index * 80}ms` }}
                className={classNames(
                  "rounded-xl border border-neutral-200 p-5 sm:p-6 bg-white cursor-pointer transition-card animate-fade-in-up relative overflow-hidden",
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
                      {typeof c.confidence === "number" && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100">
                          <span className="text-neutral-400 font-medium">AI confidence</span>
                          <span className={`font-bold ${
                            c.confidence >= 0.7 ? "text-emerald-600" :
                            c.confidence >= 0.5 ? "text-amber-500" :
                            "text-neutral-400"
                          }`}>
                            {Math.round(c.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5">
                      {(c.strengths ?? []).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Top Strengths</div>
                          <ul className="space-y-1.5">
                            {(c.strengths ?? []).slice(0, 4).map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
                                <svg className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(c.gaps ?? []).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Key Gaps</div>
                          <ul className="space-y-1.5">
                            {(c.gaps ?? []).slice(0, 3).map((g: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
                                <svg className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
      {/* ── Print-only report ───────────────────────────────────── */}
      {candidateCards.length > 0 && (
        <div className="print-only space-y-6 text-neutral-900">
          <div className="pb-5 border-b-2 border-neutral-800">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Umurava AI Screening Report</div>
            <h1 className="text-2xl font-bold">
              {currentJob?.id === jobId ? currentJob.title : "Screening Report"}
            </h1>
            <div className="mt-3 grid grid-cols-2 gap-x-12 gap-y-1 text-sm text-neutral-600">
              <div>Date: <span className="font-semibold">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div>Status: <span className="font-semibold capitalize">{results?.status}</span></div>
              <div>Job ID: <span className="font-mono text-xs">{jobId}</span></div>
              <div>Shortlist: <span className="font-semibold">Top {results?.topN}</span></div>
            </div>
          </div>

          <div className="space-y-5">
            {candidateCards.map((c: any) => (
              <div key={c.applicantId} className="border border-neutral-300 rounded-lg p-5 break-inside-avoid">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-bold text-neutral-400">#{c.rank}</span>
                      <span className="text-lg font-bold">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        c.recommendation === "SHORTLIST" ? "bg-successLight text-success border-success/30" :
                        c.recommendation === "CONSIDER"  ? "bg-warningLight text-warning border-warning/30" :
                        "bg-dangerLight text-danger border-danger/30"
                      }`}>{c.recommendation}</span>
                    </div>
                    {c.candidateHeadline && (
                      <div className="text-sm text-neutral-500 mt-0.5">{c.candidateHeadline}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-3xl font-bold">{c.matchScore}<span className="text-base font-normal">%</span></div>
                    <div className="text-[10px] uppercase tracking-widest text-neutral-400">match score</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 py-3 border-y border-neutral-100 text-center text-sm">
                  {(["skills", "experience", "education", "relevance"] as const).map((key) => (
                    <div key={key}>
                      <div className="text-base font-bold">{c.scoreBreakdown?.[key] ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-neutral-400">{key}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  {(c.strengths ?? []).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Strengths</div>
                      <ul className="space-y-0.5 text-neutral-700">
                        {(c.strengths ?? []).map((s: string, i: number) => (
                          <li key={i} className="flex gap-1.5"><span className="text-success">✓</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(c.gaps ?? []).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Key Gaps</div>
                      <ul className="space-y-0.5 text-neutral-700">
                        {(c.gaps ?? []).map((g: string, i: number) => (
                          <li key={i} className="flex gap-1.5"><span className="text-warning">⚠</span>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {c.reasoning && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">AI Reasoning</div>
                    <p className="text-sm text-neutral-600 leading-relaxed">{c.reasoning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
            Umurava AI Screening Platform &middot; Generated {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
          </div>
        </div>
      )}
    </section>
  );
}
