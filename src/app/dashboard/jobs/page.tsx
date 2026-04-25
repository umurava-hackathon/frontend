"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkListJobs, thunkDeleteJob } from "@/store/slices/dashboardSlice";
import { formatDistanceToNow } from "date-fns";
import { AlertDialog } from "@/components/ui/Modal";

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
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(thunkListJobs() as any);
  }, [dispatch]);

  const handleDeleteClick = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setJobToDelete(jobId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setDeletingId(jobToDelete);
    try {
      await dispatch(thunkDeleteJob(jobToDelete) as any);
    } finally {
      setDeletingId(null);
      setJobToDelete(null);
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
    <div className="max-w-[1300px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0F1621] tracking-tight leading-none">Recruitment Portfolio</h1>
          <p className="text-[16px] text-[#5A6474] font-medium max-w-xl">Central management for all your AI-powered screening campaigns.</p>
        </div>
        <Link
          href="/dashboard/job-create"
          className="bg-[#2B71F0] text-white px-8 py-3.5 rounded-2xl font-black text-[14px] shadow-xl shadow-blue-500/20 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 w-full md:w-auto uppercase tracking-wider"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </Link>
      </div>

      <div className="space-y-8">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-5 items-center">
           <div className="relative flex-1 w-full group">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Find a specific campaign..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#E8EAED] rounded-2xl text-[15px] font-medium focus-ring outline-none shadow-sm transition-all"
              />
           </div>
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <select 
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="flex-1 lg:w-56 px-6 py-4 bg-white border border-[#E8EAED] rounded-2xl text-[14px] font-bold text-[#5A6474] focus-ring outline-none shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%239BA5B4%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:18px] bg-[right_20px_center] bg-no-repeat transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="draft">Drafts</option>
                <option value="closed">Closed</option>
              </select>
              <div className="h-14 flex items-center px-6 bg-[#F8F9FB] border border-[#E8EAED] rounded-2xl">
                 <span className="text-[12px] font-black text-[#5A6474] uppercase tracking-widest whitespace-nowrap">
                    {filteredJobs.length} Results
                 </span>
              </div>
           </div>
        </div>

        {/* List of Job Cards */}
        <div className="grid grid-cols-1 gap-5">
           {paginatedJobs.length === 0 ? (
             <div className="py-32 text-center bg-white border border-[#E8EAED] rounded-[40px] border-dashed">
                <div className="h-16 w-16 bg-[#F8F9FB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#9BA5B4]">
                   <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-[#5A6474] font-bold">No campaigns match your search.</p>
                <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} className="mt-2 text-[#2B71F0] font-black text-[13px] uppercase tracking-wider hover:underline">Clear all filters</button>
             </div>
           ) : (
             paginatedJobs.map((job: any) => (
               <div 
                 key={job.id}
                 onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
                 className="group relative bg-white border border-[#E8EAED] rounded-[32px] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:translate-y-[-4px] cursor-pointer overflow-hidden"
               >
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[30%] bg-[#E8EAED] rounded-r-full group-hover:bg-[#2B71F0] transition-all duration-700" />
                 
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pl-4">
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                            job.status === "active" ? "bg-[#F0F7FF] text-[#2B71F0] border-[#DDE7FF]" : "bg-[#F8F9FB] text-[#9BA5B4] border-[#E8EAED]"
                          }`}>
                            {job.status}
                          </span>
                          {job.isScreened && (
                             <span className="bg-[#F0FDF4] text-[#059669] px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#10B981]/20">Intelligence Ready</span>
                          )}
                       </div>
                       <h3 className="text-[22px] font-black text-[#0F1621] tracking-tight group-hover:text-[#2B71F0] transition-colors leading-tight">{job.title}</h3>
                       <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-4">
                          <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#5A6474]">
                             <div className="h-8 w-8 rounded-xl bg-[#F5F8FF] flex items-center justify-center text-[#2B71F0]">
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                             <span className="text-[#9BA5B4] font-black uppercase text-[10px] tracking-widest mr-1">Started</span>
                             {getRelativeTime(job.createdAt)}
                          </div>
                          <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#5A6474]">
                             <div className="h-8 w-8 rounded-xl bg-[#F5F8FF] flex items-center justify-center text-[#2B71F0]">
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                             </div>
                             <span className="text-[#9BA5B4] font-black uppercase text-[10px] tracking-widest mr-1">Pool</span>
                             {job.candidateCount || 0} Candidates
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto ml-auto md:ml-0 pt-2 md:pt-0">
                       <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/jobs/${job.id}/shortlist`); }}
                          className="h-14 px-6 flex items-center gap-2 rounded-2xl bg-[#F5F8FF] text-[#2B71F0] font-black text-[13px] uppercase tracking-widest hover:bg-[#2B71F0] hover:text-white transition-all shadow-sm active:scale-95"
                       >
                          View Results
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                       </button>
                       {!job.isScreened && (
                         <button 
                           onClick={(e) => handleDeleteClick(e, job.id)}
                           disabled={deletingId === job.id}
                           className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-[#E8EAED] text-[#9BA5B4] hover:border-red-200 hover:text-[#DC2626] transition-all hover:bg-[#FEF2F2] active:scale-95"
                           title="Delete Campaign"
                         >
                            {deletingId === job.id ? (
                               <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            ) : (
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            )}
                         </button>
                       )}
                    </div>
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border border-[#E8EAED] rounded-[28px] p-4 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
             <div className="flex items-center gap-4 pl-4">
                <span className="text-[11px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Display</span>
                <div className="relative">
                  <select 
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-[#F8F9FB] border border-[#E8EAED] rounded-xl px-4 py-2 text-[13px] font-black text-[#0F1621] outline-none focus:border-[#2B71F0] appearance-none pr-8 cursor-pointer"
                  >
                    {[5, 10, 15, 20, 50].map(v => (
                      <option key={v} value={v}>{v} Campaigns</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9BA5B4]">
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
             </div>

             <div className="flex items-center gap-3 pr-2">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(p => p - 1)}
                 className="h-11 px-6 rounded-2xl border border-[#E8EAED] bg-white text-[13px] font-black text-[#5A6474] disabled:opacity-30 hover:bg-[#F8F9FB] transition-all active:scale-[0.95]"
               >
                 Prev
               </button>
               <div className="hidden md:flex gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={classNames(
                        "w-11 h-11 rounded-2xl text-[13px] font-black transition-all",
                        currentPage === p 
                          ? "bg-[#2B71F0] text-white shadow-lg shadow-blue-500/20 scale-105" 
                          : "text-[#5A6474] hover:bg-[#F8F9FB] hover:text-[#2B71F0]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="flex items-end pb-3 px-2 text-[#9BA5B4] font-black tracking-widest">...</span>}
               </div>
               <span className="md:hidden text-[13px] font-black text-[#0F1621]">Page {currentPage} / {totalPages}</span>
               <button 
                 disabled={currentPage === totalPages || totalPages === 0}
                 onClick={() => setCurrentPage(p => p + 1)}
                 className="h-11 px-6 rounded-2xl border border-[#E8EAED] bg-white text-[13px] font-black text-[#5A6474] disabled:opacity-30 hover:bg-[#F8F9FB] transition-all active:scale-[0.95]"
               >
                 Next
               </button>
             </div>
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Recruitment Campaign"
        message="Are you sure you want to permanently remove this job campaign? This action cannot be reversed."
        confirmText="Delete Campaign"
        variant="danger"
      />
    </div>
  );
}

