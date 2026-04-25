"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkFetchJob } from "@/store/slices/dashboardSlice";
import Link from "next/link";
import { StructuredJD } from "@/components/ui/StructuredJD";

export default function JobDetailsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const job = useAppSelector((s) => s.dashboard.currentJob);
  const loading = useAppSelector((s) => s.dashboard.loading);

  useEffect(() => {
    if (jobId) {
      void dispatch(thunkFetchJob(jobId) as any);
    }
  }, [jobId, dispatch]);

  if (loading) return <div className="p-20 text-center text-[#9BA5B4] font-bold uppercase tracking-widest animate-pulse">Loading Mission...</div>;
  if (!job) return <div className="p-20 text-center text-[#9BA5B4]">Campaign not found.</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 animate-in fade-in duration-500 pb-24 font-jakarta">
      {/* Functional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
           <div className="flex items-center gap-2 text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">
              <Link href="/dashboard/jobs" className="hover:text-[#2B71F0] transition-colors">Campaigns</Link>
              <span>/</span>
              <span className="text-[#0F1621]">Mission Details</span>
           </div>
           <h1 className="text-3xl font-bold text-[#0F1621] tracking-tight">{job.title}</h1>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist`)}
             className="px-6 py-2.5 bg-[#2B71F0] text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-500/10 hover:bg-[#1A5CE0] transition-all active:scale-95 flex items-center gap-2"
           >
              View Results
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Mission Section */}
            <div className="bg-white border border-[#E8EAED] rounded-2xl p-8 space-y-6 shadow-sm">
               <h2 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-widest flex items-center gap-3">
                  Campaign Mission
                  <div className="h-px bg-[#F5F6FA] flex-1" />
               </h2>
               <StructuredJD content={job.description || ""} />
            </div>

            {/* Calibration */}
            <div className="bg-white border border-[#E8EAED] rounded-2xl p-8 space-y-6 shadow-sm">
               <h2 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-widest flex items-center gap-3">
                  Score Calibration
                  <div className="h-px bg-[#F5F6FA] flex-1" />
               </h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(job.scoringWeights || {}).map(([key, val]: any) => (
                     <div key={key} className="bg-[#F8F9FB] rounded-xl p-4 text-center">
                        <div className="text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest mb-1">{key}</div>
                        <div className="text-[18px] font-bold text-[#0F1621]">{val}%</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#F8F9FB] border border-[#E8EAED] rounded-2xl p-6 space-y-6">
               <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-[#0F1621] uppercase tracking-widest">Metadata</h3>
                  <div className="space-y-3">
                     <div className="flex justify-between text-[13px]">
                        <span className="text-[#5A6474]">Contract</span>
                        <span className="font-bold text-[#0F1621]">{job.employmentType}</span>
                     </div>
                     <div className="flex justify-between text-[13px]">
                        <span className="text-[#5A6474]">Location</span>
                        <span className="font-bold text-[#0F1621]">{job.location}</span>
                     </div>
                     <div className="flex justify-between text-[13px]">
                        <span className="text-[#5A6474]">Experience</span>
                        <span className="font-bold text-[#0F1621]">{job.requirements?.yearsExperienceMin}+ Years</span>
                     </div>
                  </div>
               </div>

               <div className="h-px bg-[#E8EAED] w-full" />

               <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-[#0F1621] uppercase tracking-widest">Core Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                     {(job.requirements?.mustHave || []).map((s: string) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-white border border-[#E8EAED] text-[11px] font-bold text-[#5A6474] shadow-sm">
                           {s}
                        </span>
                     ))}
                  </div>
               </div>
            </div>

            <button 
               onClick={() => router.push(`/dashboard/jobs/${jobId}/edit`)}
               className="w-full py-3.5 rounded-xl border border-[#E8EAED] bg-white text-[13px] font-bold text-[#5A6474] uppercase tracking-widest hover:bg-[#F8F9FB] hover:text-[#0F1621] transition-all"
            >
               Edit Mission
            </button>
         </div>
      </div>
    </div>
  );
}
