"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchApplicants, thunkFetchResults, thunkTriggerScreening } from "@/store/slices/dashboardSlice";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ScreenJobPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);
  const applicants = useAppSelector((s) => s.dashboard.applicants);

  const [topN, setTopN] = useState<10 | 20>(10);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("Waiting to start...");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hasApplicants = useMemo(() => Array.isArray(applicants) && applicants.length > 0, [applicants]);
  const canStart = useMemo(() => !!jobId && !loading && hasApplicants, [jobId, loading, hasApplicants]);

  useEffect(() => {
    if (jobId) {
      void dispatch(thunkFetchApplicants(jobId) as any);
      void dispatch(thunkFetchResults(jobId) as any);
    }
  }, [jobId, dispatch]);

  useEffect(() => {
    if (!loading) return;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(90, Math.round(p + (Math.random() * 6 + 2)));
        return next > p ? next : p + 1;
      });
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  async function startScreening() {
    if (!jobId) return;
    setLoading(true);
    setProgress(5);
    setStatusText("Preparing screening run...");

    try {
      await dispatch(thunkTriggerScreening({ jobId, topN }) as any);
      setStatusText("Evaluating candidates with Gemini...");

      const startedAt = Date.now();
      const timeoutMs = 2 * 60 * 1000;
      while (true) {
        if (Date.now() - startedAt > timeoutMs) throw new Error("Timed out waiting for screening results");
        const action = await dispatch(thunkFetchResults(jobId) as any);
        if (thunkFetchResults.fulfilled.match(action)) {
          const r = action.payload;
          const status = r?.status;
          if (status && !["queued", "running"].includes(status)) {
            setStatusText(status === "partial" ? "Screening completed (partial)." : `Screening completed (${status}).`);
            setProgress(100);
            router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`);
            return;
          }
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
    } catch (err: any) {
      setStatusText(err?.message ?? "Screening failed.");
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="px-4 sm:px-0">
        <h1 className="page-title">Trigger screening</h1>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          Start AI screening for this job. Gemini will rank candidates based on your custom weights and the Umurava schema.
        </p>
      </div>

      <div className="bg-white rounded-2xl sm:shadow-soft border-y sm:border border-gray-200 p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-900">Shortlist size</div>
            <div className="text-xs text-gray-500">How many top matches do you want Gemini to prioritize?</div>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[10, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTopN(n as 10 | 20)}
                className={classNames(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all focus-ring",
                  topN === n ? "bg-white text-[#1F2A37] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">AI Engine Status</div>
            <div className="text-xs font-bold text-[#1F2A37]">
              {results?.status ? `Last Run: ${results.status}` : "No runs found"}
            </div>
          </div>

          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              aria-label="screening progress"
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {loading && <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />}
            {loading ? statusText : !hasApplicants ? "No candidates found for this job." : "Ready to analyze candidates."}
          </div>
        </div>

        {!hasApplicants ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold">Incomplete data: Ingest candidates first</span>
            </div>
            <button
              onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/ingest`)}
              className="w-full sm:w-auto rounded-xl px-6 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card shadow-sm font-medium focus-ring"
            >
              Go to ingestion
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void startScreening()}
              className="rounded-xl px-10 py-4 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 disabled:cursor-not-allowed transition-card shadow-soft font-bold focus-ring"
            >
              {loading ? "Screening..." : "Start AI analysis"}
            </button>
            {results?.status && !loading && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
                className="rounded-xl px-6 py-4 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-card shadow-sm font-bold focus-ring"
              >
                View previous results
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
