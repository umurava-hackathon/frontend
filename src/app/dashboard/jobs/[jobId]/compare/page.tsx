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
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Comparison mode</h1>
          <p className="mt-1 text-sm text-gray-600">Select exactly two candidates to compare strengths, gaps and score dimensions.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
            className="rounded-xl px-5 py-2 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
          >
            Back to shortlist
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900">Pick two candidates</div>
        {shortlist.length === 0 ? (
          <div className="text-sm text-gray-600">No candidates loaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shortlist.map((c: any) => {
              const checked = selected.includes(c.applicantId);
              const isTop3 = c.rank <= 3;
              return (
                <div
                  key={c.applicantId}
                  className={classNames(
                    "rounded-2xl border p-4 cursor-pointer transition-shadow hover:shadow-soft",
                    checked ? "border-[#1F2A37]" : isTop3 ? "border-gray-300" : "border-gray-200"
                  )}
                  onClick={() => toggleCandidate(c.applicantId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="pt-1">
                        <div className={classNames("inline-flex items-center justify-center rounded-full h-9 w-9 text-sm font-bold border", isTop3 ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-gray-50 text-gray-900 border-gray-200")}>
                          {c.rank}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</div>
                        {c.candidateHeadline ? <div className="text-xs text-gray-600 mt-1">{c.candidateHeadline}</div> : null}
                      </div>
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleCandidate(c.applicantId)} aria-label="Select candidate" />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {selectedCandidates.map((c: any) => (
          <div key={c.applicantId} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Candidate #{c.rank}</div>
                <div className="text-lg font-semibold text-gray-900">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</div>
                {c.candidateHeadline ? <div className="text-xs text-gray-600 mt-1">{c.candidateHeadline}</div> : null}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Match</div>
                <div className="text-lg font-semibold text-gray-900">{c.matchScore}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700">Score dimensions</div>
              <BreakdownBars breakdown={c.scoreBreakdown} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Top strengths</div>
                <div className="flex flex-wrap gap-2">
                  {(c.strengths ?? []).slice(0, 3).map((s: string) => (
                    <GreenPill key={s}>{s}</GreenPill>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Gaps / risks</div>
                <div className="flex flex-wrap gap-2">
                  {(c.gaps ?? []).slice(0, 3).map((s: string) => (
                    <AmberPill key={s}>{s}</AmberPill>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-gray-700">AI reasoning</div>
                <button
                  type="button"
                  onClick={() => setExpandedReasoning((prev) => (prev === c.applicantId ? null : c.applicantId))}
                  className="text-xs text-[#1F2A37] font-semibold hover:underline"
                >
                  {expandedReasoning === c.applicantId ? "Hide" : "Show"}
                </button>
              </div>
              {expandedReasoning === c.applicantId ? <p className="text-sm text-gray-800 leading-relaxed">{c.reasoning}</p> : <div className="text-sm text-gray-600">Click “Show” to read recruiter-friendly rationale.</div>}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <RecommendationBadge value={c.recommendation} />
              <BiasIndicator biasFlags={c.biasFlags} />
              <div className="text-xs text-gray-600">
                Confidence:{" "}
                <span className="font-semibold text-gray-900">{typeof c.confidence === "number" ? `${Math.round(c.confidence * 100)}%` : "—"}</span>
              </div>
            </div>
          </div>
        ))}

        {selectedCandidates.length < 2 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm text-gray-600">
            Select two candidates to see side-by-side comparison.
          </div>
        ) : null}
      </div>
    </section>
  );
}

