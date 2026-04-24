"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  thunkFetchApplicants,
  thunkTriggerScreening,
  clearResults
} from "@/store/slices/dashboardSlice";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { firstName, lastName, name, fullName, email, id, applicantId } = c;
  
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return (
    firstName ||
    lastName ||
    name ||
    fullName ||
    email ||
    `Candidate ${(id || applicantId)?.slice(-4) || "????"}`
  );
}

export default function ScreenPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  
  const applicants = useAppSelector((s) => s.dashboard.applicants);
  const { triggering, error } = useAppSelector((s) => s.dashboard.screening);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topN, setTopN] = useState<10 | 20>(10);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchApplicants(jobId) as any);
  }, [jobId, dispatch]);

  const readyApplicants = useMemo(() => {
    return (applicants ?? []).filter((a) => a.ingestionStatus === "ready");
  }, [applicants]);

  const toggleAll = () => {
    if (selectedIds.length === readyApplicants.length) setSelectedIds([]);
    else setSelectedIds(readyApplicants.map((a) => a.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleStart = async () => {
    if (!jobId || selectedIds.length === 0) return;
    dispatch(clearResults());
    const resAction = await dispatch(
      thunkTriggerScreening({
        jobId,
        topN,
        applicantIds: selectedIds,
      }) as any
    );
    if (thunkTriggerScreening.fulfilled.match(resAction)) {
      router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621]">Screen Candidates</h1>
          <p className="text-sm text-[#5A6474]">Configure AI parameters and select talent for this screening run.</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
          className="text-sm font-semibold text-[#2B71F0] hover:underline"
        >
          ← Back to job
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#E8EAED] rounded-xl p-6 shadow-sm space-y-8">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-[#9BA5B4] uppercase tracking-widest">Shortlist Size</h2>
              <div className="grid grid-cols-2 gap-3">
                {[10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n as any)}
                    className={classNames(
                      "py-3 rounded-lg border text-sm font-bold transition-all",
                      topN === n 
                        ? "bg-[#EEF4FF] border-[#2B71F0] text-[#2B71F0] ring-1 ring-[#2B71F0]" 
                        : "bg-white border-[#E8EAED] text-[#5A6474] hover:border-[#2B71F0]"
                    )}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#9BA5B4] leading-relaxed">
                The AI will rank all selected candidates and provide detailed reasoning for the top {topN}.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold text-[#9BA5B4] uppercase tracking-widest">Selection Summary</h2>
              <div className="bg-[#F8F9FC] rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5A6474]">Candidates selected</span>
                  <span className="font-bold text-[#0F1621]">{selectedIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5A6474]">Target shortlist</span>
                  <span className="font-bold text-[#0F1621]">Top {topN}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={triggering || selectedIds.length === 0}
              className="w-full bg-[#2B71F0] hover:bg-[#1A5CE0] text-white py-4 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {triggering ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting AI analysis...
                </>
              ) : (
                "Trigger Screening"
              )}
            </button>
          </div>
        </div>

        {/* Right: Candidate List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-[#F8F9FC] border-b border-[#E8EAED] flex items-center justify-between">
              <div className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
                Eligible Talent ({readyApplicants.length})
              </div>
              <button
                onClick={toggleAll}
                className="text-xs font-bold text-[#2B71F0] hover:underline"
              >
                {selectedIds.length === readyApplicants.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-[#F5F6FA]">
              {readyApplicants.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-sm text-[#5A6474]">No eligible candidates found for this job.</p>
                  <button 
                    onClick={() => router.push(`/dashboard/jobs/${jobId}/ingest`)}
                    className="text-xs font-bold text-[#2B71F0] uppercase tracking-widest hover:underline"
                  >
                    Ingest candidates first
                  </button>
                </div>
              ) : (
                readyApplicants.map((a) => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <div 
                      key={a.id}
                      onClick={() => toggleOne(a.id)}
                      className={classNames(
                        "px-6 py-4 flex items-center gap-4 cursor-pointer transition-colors",
                        isSelected ? "bg-[#EEF4FF]" : "hover:bg-[#F8F9FC]"
                      )}
                    >
                      <div className={classNames(
                        "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-[#2B71F0] border-[#2B71F0]" : "border-[#CBD5E1] bg-white"
                      )}>
                        {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-[#0F1621] truncate">{getDisplayName(a)}</div>
                        <div className="text-[12px] text-[#5A6474] font-medium truncate mt-0.5">{a.email || "No email"}</div>
                      </div>
                      {a.sourceType && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-white border border-[#E8EAED] text-[#9BA5B4]">
                          {a.sourceType.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
