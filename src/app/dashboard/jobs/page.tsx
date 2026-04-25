"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkListJobs, thunkDeleteJob } from "@/store/slices/dashboardSlice";
import { formatDistanceToNow } from "date-fns";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function JobsListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobList = useAppSelector((s) => s.dashboard.jobList) as any[];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(thunkListJobs() as any);
  }, [dispatch]);

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    setDeletingId(jobId);
    try {
      await dispatch(thunkDeleteJob(jobId) as any);
    } finally {
      setDeletingId(null);
    }
  };

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
  }, [filteredJobs, currentPage, itemsPerPage]);

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

      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden flex flex-col pr-[20px]">
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
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '140px' }} />
            </colgroup>
            <thead className="bg-[#F5F6FA] border-b border-[#E8EAED]">
              <tr className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Screened</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6FA]">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[#5A6474]">No jobs found matching your filters.</td>
                </tr>
              ) : (
                paginatedJobs.map((job: any, i) => (
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
                    <td className="px-6 py-5 text-center">
                       {job.isScreened ? (
                          <span className="text-[#2B71F0] font-medium text-[13px] whitespace-nowrap">
                             ● YES
                          </span>
                       ) : (
                          <span className="text-[#9BA5B4] font-normal text-[13px] whitespace-nowrap">NO</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-[#5A6474] text-sm">
                      {getRelativeTime(job.createdAt)}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end">
                         <span className="text-[#2B71F0] font-medium text-[14px] hover:underline whitespace-nowrap">View details</span>
                         {!job.isScreened && (
                            <button 
                              onClick={(e) => handleDelete(e, job.id)}
                              disabled={deletingId === job.id}
                              className="p-2 text-[#9BA5B4] hover:text-[#DC2626] transition-all ml-3"
                              title="Delete job"
                            >
                               {deletingId === job.id ? (
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                               ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               )}
                            </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-[#F5F6FA]">
          {paginatedJobs.map((job: any) => (
            <div 
              key={job.id} 
              onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
              className="p-5 active:bg-[#F8F9FC] space-y-3 relative group"
            >
              <div className="flex justify-between items-start">
                <div className="font-bold text-[#0F1621] pr-10">{job.title}</div>
                {!job.isScreened && (
                   <button 
                     onClick={(e) => handleDelete(e, job.id)}
                     className="p-2 text-red-500 bg-red-50 rounded-lg"
                   >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    job.status === "active" ? "bg-[#2B71F0] text-white" : "bg-[#E8EAED] text-[#5A6474]"
                  }`}>
                    {job.status}
                  </span>
                  {job.isScreened && (
                     <span className="text-[#10B981] font-bold text-[10px] uppercase tracking-tight">Screened</span>
                  )}
                </div>
                <span className="text-[12px] text-[#9BA5B4]">{getRelativeTime(job.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {(totalPages > 1 || filteredJobs.length > 5) && (
          <div className="p-4 border-t border-[#E8EAED] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8F9FC]">
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-wider">Show</span>
                <select 
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-[#E8EAED] rounded px-2 py-1 text-xs font-bold text-[#5A6474] outline-none focus:border-[#2B71F0]"
                >
                  {[5, 10, 15, 20, 50].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-wider">per page</span>
             </div>

             <div className="flex items-center gap-4">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(p => p - 1)}
                 className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
               >
                 Previous
               </button>
               <span className="text-xs font-bold text-[#9BA5B4] uppercase tracking-widest">
                 Page {currentPage} of {totalPages || 1}
               </span>
               <button 
                 disabled={currentPage === totalPages || totalPages === 0}
                 onClick={() => setCurrentPage(p => p + 1)}
                 className="px-4 py-2 rounded-lg border border-[#E8EAED] bg-white text-sm font-bold text-[#5A6474] disabled:opacity-40 hover:bg-neutral-50 transition-colors"
               >
                 Next
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
