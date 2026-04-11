"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkListJobs } from "@/store/slices/dashboardSlice";

export default function JobsListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { jobList, loading } = useAppSelector((s) => ({
    jobList: s.dashboard.jobList,
    loading: s.dashboard.jobCreate.loading // reuse loading state or check slice
  }));

  useEffect(() => {
    void dispatch(thunkListJobs() as any);
  }, [dispatch]);

  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Jobs dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your active screenings and candidate pipelines.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/job-create")}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
        >
          Create new job
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
        {jobList.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-20 text-center shadow-sm space-y-8">
            <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <h3 className="text-lg font-medium text-neutral-800">No jobs created yet</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">Create your first job requirement to start screening candidates with Umurava AI.</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/job-create")}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
            >
              Get started
            </button>
          </div>
        ) : (
          jobList.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
              className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 cursor-pointer hover:border-primary-300 hover:shadow-card transition-card group shadow-sm"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-neutral-800 group-hover:text-primary-500 transition-colors">{job.title}</h3>
                <div className="flex items-center gap-4 text-[12px] text-neutral-400">
                  <span className="bg-successLight text-success px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-[10px] border border-success/20">{job.status}</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                View shortlist
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
