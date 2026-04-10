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
          <h1 className="page-title">Jobs dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your active screenings and candidate pipelines.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/job-create")}
          className="w-full sm:w-auto rounded-xl px-6 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card focus-ring shadow-soft font-medium"
        >
          Create new job
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
        {jobList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-soft space-y-6">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <h3 className="text-lg font-bold text-gray-900">No jobs created yet</h3>
              <p className="text-sm text-gray-500">Create your first job requirement to start screening candidates with Umurava AI.</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/job-create")}
              className="rounded-xl px-8 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card"
            >
              Get started
            </button>
          </div>
        ) : (
          jobList.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
              className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-300 hover:shadow-soft transition-card group"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{job.status}</span>
                  <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                View shortlist
                <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
