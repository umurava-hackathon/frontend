"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkListJobs } from "@/store/slices/dashboardSlice";
import { formatDistanceToNow } from "date-fns";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function JobsListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobList = useAppSelector((s) => s.dashboard.jobList);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    void dispatch(thunkListJobs() as any);
  }, [dispatch]);

  const filteredJobs = useMemo(() => {
    return jobList.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobList, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const getRelativeTime = (date: string | undefined) => {
    if (!date) return "Unknown";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621]">Jobs</h1>
          <p className="text-sm text-[#5A6474]">Manage your active and draft recruitment campaigns.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/job-create")}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#2B71F0] text-white rounded-lg text-sm font-bold hover:bg-[#1A5CE0] transition-all shadow-sm active:scale-[0.98]"
        >
          Create new job
        </button>
      </div>

      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-5 border-b border-[#E8EAED] flex flex-col sm:flex-row gap-4 bg-[#F8F9FC]">
           <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search jobs by title..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none"
              />
           </div>
           <select 
             value={statusFilter}
             onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
             className="px-4 py-2 bg-white border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none min-w-[140px]"
           >
             <option value="all">All Statuses</option>
             <option value="active">Active</option>
             <option value="draft">Draft</option>
             <option value="closed">Closed</option>
           </select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead className="bg-[#F5F6FA] border-b border-[#E8EAED]">
              <tr className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6FA]">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-[#5A6474]">No jobs found matching your filters.</td>
                </tr>
              ) : (
                paginatedJobs.map((job, i) => (
                  <tr 
                    key={job.id} 
                    onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
                    className="hover:bg-[#F8F9FC] transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <div className="font-bold text-[#0F1621] line-clamp-1" title={job.title}>{job.title}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        job.status === "active" 
                          ? "bg-[#2B71F0] text-white border-[#2B71F0]" 
                          : "bg-[#E8EAED] text-[#5A6474] border-[#E8EAED]"
                      }`}>
                        {job.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[#5A6474] text-sm">
                      {getRelativeTime(job.createdAt)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-[#2B71F0] font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity">View details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-[#F5F6FA]">
          {paginatedJobs.map((job) => (
            <div 
              key={job.id} 
              onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
              className="p-5 active:bg-[#F8F9FC] space-y-3"
            >
              <div className="font-bold text-[#0F1621]">{job.title}</div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  job.status === "active" ? "bg-[#2B71F0] text-white" : "bg-[#E8EAED] text-[#5A6474]"
                }`}>
                  {job.status}
                </span>
                <span className="text-[12px] text-[#9BA5B4]">{getRelativeTime(job.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E8EAED] flex items-center justify-between bg-[#F8F9FC]">
             <button 
               disabled={currentPage === 1}
               onClick={() => setCurrentPage(p => p - 1)}
               className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
             >
               Previous
             </button>
             <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-widest">
               Page {currentPage} of {totalPages}
             </span>
             <button 
               disabled={currentPage === totalPages}
               onClick={() => setCurrentPage(p => p + 1)}
               className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
             >
               Next
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
