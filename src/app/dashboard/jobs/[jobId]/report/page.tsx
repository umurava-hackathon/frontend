"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchJob, thunkFetchResults } from "@/store/slices/dashboardSlice";
import type { PDFCandidate } from "@/components/reports/CandidateReportPDF";

const PDFDownloadButton = dynamic(
  () => import("@/components/reports/PDFDownloadButton"),
  { ssr: false, loading: () => <span className="text-xs text-neutral-400">Preparing…</span> }
);

const REC_STYLE: Record<string, { badge: string; dot: string }> = {
  SHORTLIST: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  CONSIDER:  { badge: "bg-amber-50  text-amber-700  border-amber-200",  dot: "bg-amber-400"  },
  DECLINE:   { badge: "bg-red-50    text-red-600    border-red-200",    dot: "bg-red-400"    },
};

const DIM_SCORE_COLOR = (v: number) =>
  v >= 70 ? "text-emerald-600" : v >= 45 ? "text-amber-500" : "text-red-500";

function ScoreGrid({ bd }: { bd: { skills: number; experience: number; education: number; relevance: number } }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["skills", "experience", "education", "relevance"] as const).map((key) => (
        <div key={key} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5 capitalize">{key}</div>
          <div className={`text-[22px] font-bold leading-none ${DIM_SCORE_COLOR(bd[key])}`}>{bd[key]}</div>
        </div>
      ))}
    </div>
  );
}

export default function ReportPage() {
  const params       = useParams<{ jobId: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const jobId        = params.jobId;
  const dispatch     = useAppDispatch();
  const autoPrint    = searchParams.get("autoprint") === "1";

  const results    = useAppSelector((s) => s.dashboard.results);
  const currentJob = useAppSelector((s) => s.dashboard.currentJob);
  const loading    = useAppSelector((s) => s.dashboard.loading);
  const didPrint   = useRef(false);

  const isCorrectJob = results?.jobId === jobId;
  const isReady = !loading && isCorrectJob && results?.status !== "queued" && results?.status !== "running";

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchResults(jobId) as any);
    void dispatch(thunkFetchJob(jobId) as any);
  }, [jobId, dispatch]);

  useEffect(() => {
    if (autoPrint && isReady && !didPrint.current) {
      didPrint.current = true;
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
  }, [autoPrint, isReady]);

  const shortlist = (isCorrectJob ? results?.shortlist ?? [] : []) as any[];
  const jobTitle  = currentJob?.title ?? "Screening Report";
  const runDate   = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const statusBadge: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700",
    partial:   "bg-amber-50  text-amber-700",
    failed:    "bg-red-50    text-red-600",
    running:   "bg-primary-50  text-primary-600 animate-pulse",
    queued:    "bg-neutral-100 text-neutral-500",
  };

  if ((loading || !isCorrectJob) && results?.status !== "failed") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-neutral-400 text-sm animate-pulse">
          <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" />
          Loading report data…
        </div>
      </div>
    );
  }

  if (isCorrectJob && (results?.status === "queued" || results?.status === "running")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="h-16 w-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-neutral-800">AI Screening in Progress</h2>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto">
            The report will be available as soon as the AI finishes analyzing your candidates.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
            className="px-6 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-bold hover:bg-neutral-50 transition-all"
          >
            Back to shortlist
          </button>
          <button 
            onClick={() => void dispatch(thunkFetchResults(jobId) as any)}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold hover:bg-primary-600 transition-all"
          >
            Check status
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Action bar (screen-only) ── */}
      <div className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
              className="shrink-0 flex items-center gap-2 text-primary-500 hover:text-primary-600 font-bold text-sm transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-200 mx-1 hidden sm:block" />
            <span className="text-sm font-semibold text-neutral-800 truncate">{jobTitle}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:block text-xs text-neutral-400">
              {shortlist.length} candidate{shortlist.length !== 1 ? "s" : ""} · Top {results?.topN ?? "?"}
            </span>
            <PDFDownloadButton
              variant="full"
              jobTitle={jobTitle}
              jobId={jobId}
              runDate={runDate}
              status={results?.status}
              totalTopN={results?.topN}
              candidates={shortlist as PDFCandidate[]}
            />
          </div>
        </div>
      </div>

      {/* ── Report document ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10">

        {/* Cover */}
        <div className="border-b-2 border-neutral-900 pb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-2">
                Umurava · AI Screening Report
              </p>
              <h1 className="text-3xl font-bold text-neutral-900 leading-snug">{jobTitle}</h1>
              <p className="mt-1.5 text-sm text-neutral-500">
                AI-generated candidate ranking — recruiter review required before final decision.
              </p>
            </div>
            <div className="text-sm text-neutral-500 sm:text-right shrink-0 space-y-0.5">
              <div className="font-medium text-neutral-700">{runDate}</div>
              <div className="font-mono text-[11px] text-neutral-400 break-all">{jobId}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total screened",  value: results?.topN ?? "—" },
              { label: "Shortlisted",     value: shortlist.filter((c) => c.recommendation === "SHORTLIST").length },
              { label: "For review",      value: shortlist.filter((c) => c.recommendation === "CONSIDER").length },
              {
                label: "Run status",
                value: (
                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${statusBadge[results?.status ?? ""] ?? "bg-neutral-100 text-neutral-500"}`}>
                    {results?.status ?? "—"}
                  </span>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{item.label}</div>
                <div className="text-xl font-bold text-neutral-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidate cards */}
        {shortlist.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm">No candidates found in this shortlist.</div>
        ) : (
          <div className="space-y-6">
            {shortlist.map((c: any, idx: number) => {
              const rec      = (c.recommendation ?? "DECLINE") as string;
              const style    = REC_STYLE[rec] ?? REC_STYLE.DECLINE;
              const conf     = typeof c.confidence === "number" ? Math.round(c.confidence * 100) : null;
              const name     = c.candidateName ?? `Candidate #${c.rank ?? idx + 1}`;
              const breakdown= c.scoreBreakdown ?? {};

              return (
                <div key={c.applicantId ?? idx} className="relative break-inside-avoid rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                  {/* Internal Accent Bar */}
                  <div className="absolute left-0 top-[20%] bottom-[20%] w-1.5 rounded-full bg-[#2B71F0]/40 z-10" />
                  
                  {/* Header row */}
                  <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-b border-neutral-100 relative">
                    <div className="flex items-center gap-4 min-w-0 pl-2">
                      <div className="h-8 w-8 rounded-full bg-neutral-900 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                        {c.rank ?? idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[16px] font-semibold text-neutral-900 truncate">{name}</div>
                        {c.candidateHeadline && (
                          <div className="text-[12px] text-neutral-500 truncate">{c.candidateHeadline}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${style.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {rec}
                      </span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-neutral-900 leading-none">{c.matchScore}<span className="text-sm font-normal text-neutral-400">%</span></div>
                        <div className="text-[9px] uppercase tracking-widest text-neutral-400">match</div>
                      </div>
                      <PDFDownloadButton
                        variant="single"
                        candidate={c as PDFCandidate}
                        jobTitle={jobTitle}
                        runDate={runDate}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Score breakdown */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Score Breakdown</p>
                      {breakdown.skills !== undefined && <ScoreGrid bd={breakdown} />}
                      {conf !== null && (
                        <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400">
                          <span>AI confidence</span>
                          <span className={`font-bold ${conf >= 70 ? "text-emerald-600" : conf >= 50 ? "text-amber-600" : "text-neutral-500"}`}>{conf}%</span>
                        </div>
                      )}
                    </div>

                    {/* Strengths + Gaps */}
                    <div className="space-y-4">
                      {(c.strengths ?? []).length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Strengths</p>
                          <ul className="space-y-1.5">
                            {(c.strengths as string[]).map((s, i) => (
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
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Key Gaps</p>
                          <ul className="space-y-1.5">
                            {(c.gaps as string[]).map((g, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
                                <svg className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                  {/* Reasoning */}
                  {c.reasoning && (
                    <div className="px-5 pb-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">AI Reasoning</p>
                      <p className="text-[13px] leading-relaxed text-neutral-600 bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100">
                        {c.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <span>Umurava AI Screening Platform</span>
          <span>Generated {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</span>
        </div>
      </div>
    </>
  );
}
