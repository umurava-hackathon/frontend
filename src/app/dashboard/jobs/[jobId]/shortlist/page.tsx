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

export default function ShortlistPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const results = useAppSelector((s) => s.dashboard.results);

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

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shortlist</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ranked candidates with transparent strengths, gaps and AI bias awareness.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/compare`)}
            className="rounded-xl px-5 py-2 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
          >
            Compare mode
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
            className="rounded-xl px-5 py-2 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
          >
            Run again
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Run status: <span className="font-semibold text-gray-900">{results?.status ?? "unknown"}</span>
          </div>
          <div className="text-xs text-gray-600">
            Showing Top {results?.topN ?? "?"} candidates.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {candidateCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
            No shortlist results yet. Run screening and come back here.
          </div>
        ) : (
          candidateCards.map((c: any) => {
            const isTop3 = c.rank <= 3;
            const isExpanded = expandedCandidateId === c.applicantId;
            const topBorder = isTop3 ? "border-[#1F2A37]" : "border-gray-200";

            return (
              <div
                key={c.applicantId}
                className={classNames(
                  "rounded-2xl border p-4 bg-white cursor-pointer transition-shadow hover:shadow-soft",
                  topBorder
                )}
                onClick={() => setExpandedCandidateId((prev) => (prev === c.applicantId ? null : c.applicantId))}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div
                        className={classNames(
                          "inline-flex items-center justify-center rounded-full h-9 w-9 text-sm font-bold border",
                          isTop3 ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-gray-50 text-gray-900 border-gray-200"
                        )}
                      >
                        {c.rank}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <ScoreRing score={c.matchScore} />
                      </div>
                      <div className="min-w-[220px]">
                        <div className="font-semibold text-gray-900">{c.candidateName ?? `Candidate ${c.applicantId.slice(-4)}`}</div>
                        {c.candidateHeadline ? <div className="text-xs text-gray-600 mt-1">{c.candidateHeadline}</div> : null}
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <RecommendationBadge value={c.recommendation} />
                          <BiasIndicator biasFlags={c.biasFlags} />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Confidence:{" "}
                          <span className="font-semibold text-gray-900">
                            {typeof c.confidence === "number" ? `${Math.round(c.confidence * 100)}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{c.matchScore}</div>
                    <div className="text-xs text-gray-600">match score</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {isExpanded ? (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700">AI reasoning</div>
                      <p className="text-sm text-gray-800 leading-relaxed">{c.reasoning}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700">Score breakdown</div>
                      <BreakdownBars breakdown={c.scoreBreakdown} />
                    </div>
                    {c.biasFlags?.length ? (
                      <div className="text-xs text-gray-600">
                        Bias flags:{" "}
                        <span className="text-gray-900 font-semibold">
                          {c.biasFlags.map((b: any) => b.type).slice(0, 3).join(", ")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

