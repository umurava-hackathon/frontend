"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchResults, thunkTriggerScreening } from "@/store/slices/dashboardSlice";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ScreenJobPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);

  const [topN, setTopN] = useState<10 | 20>(10);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("Waiting to start...");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canStart = useMemo(() => !!jobId && !loading, [jobId, loading]);

  useEffect(() => {
    if (!loading) return;
    // Animated progress: gradually approach 90% until backend reports completion.
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

      // Poll results until completion.
      const startedAt = Date.now();
      const timeoutMs = 2 * 60 * 1000;
      // eslint-disable-next-line no-constant-condition
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
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Trigger screening</h1>
        <p className="mt-1 text-sm text-gray-600">
          Start AI screening for a job. The system produces an explainable ranked shortlist, with recruiter review.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Shortlist size</div>
            <div className="text-xs text-gray-600 mt-1">Choose how many top candidates you want to see.</div>
          </div>
          <div className="flex gap-2">
            {[10, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTopN(n as 10 | 20)}
                className={classNames(
                  "rounded-xl px-4 py-2 border text-sm",
                  topN === n ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">Run status</div>
            <div className="text-xs text-gray-600">
              {results?.status ? `Current: ${results.status}` : "No run yet for this job"}
            </div>
          </div>

          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${progress}%` }}
              aria-label="screening progress"
            />
          </div>

          <div className="text-sm text-gray-700">{loading ? statusText : "Ready when you are."}</div>
        </div>

        <button
          type="button"
          disabled={!canStart}
          onClick={() => void startScreening()}
          className="rounded-xl px-6 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Screening in progress..." : "Run screening"}
        </button>

        {results?.status && !loading ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
              className="rounded-xl px-5 py-2 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
            >
              View shortlist
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

