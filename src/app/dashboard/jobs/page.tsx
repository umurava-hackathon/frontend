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
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-500 pb-24 font-jakarta">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621] tracking-tight">Recruitment Campaigns</h1>
          <p className="text-sm text-[#5A6474] font-medium">Manage and track your AI-powered candidate evaluations.</p>
        </div>
        <Link
          href="/dashboard/job-create"
          className="bg-[#2B71F0] text-white px-6 py-3 rounded-xl font-bold text-[14px] shadow-lg shadow-blue-500/10 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white border border-[#E8EAED] p-4 rounded-2xl shadow-sm">
         <div className="relative flex-1 w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Filter campaigns..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FB] border border-transparent rounded-xl text-[14px] font-medium focus:bg-white focus:border-[#2B71F0]/20 outline-none transition-all"
            />
         </div>
         <select 
           value={statusFilter}
           onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
           className="w-full lg:w-48 px-4 py-2.5 bg-[#F8F9FB] border border-transparent rounded-xl text-[14px] font-bold text-[#5A6474] outline-none cursor-pointer hover:bg-[#EEF4FF] transition-all"
         >
           <option value="all">All Statuses</option>
           <option value="active">Active Only</option>
           <option value="draft">Drafts</option>
         </select>
         <div className="hidden lg:block h-6 w-[1px] bg-[#E8EAED]" />
         <span className="text-[12px] font-bold text-[#9BA5B4] uppercase px-2">{filteredJobs.length} Campaigns</span>
      </div>

      <div className="space-y-4">
         {paginatedJobs.length === 0 ? (
           <div className="py-20 text-center bg-white border border-[#E8EAED] rounded-3xl border-dashed">
              <p className="text-[#9BA5B4] font-medium italic">No matches found.</p>
           </div>
         ) : (
           paginatedJobs.map((job: any) => (
             <div 
               key={job.id}
               className="bg-white border border-[#E8EAED] rounded-2xl p-6 transition-all duration-300 hover:shadow-md group"
             >
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                          job.status === "active" ? "bg-[#F0F7FF] text-[#2B71F0] border-[#DDE7FF]" : "bg-[#F8F9FB] text-[#9BA5B4] border-[#E8EAED]"
                        }`}>
                          {job.status}
                        </span>
                        {job.isScreened && (
                           <span className="bg-[#F0FDF4] text-[#059669] px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-[#10B981]/20">Results Ready</span>
                        )}
                     </div>
                     <h3 className="text-[18px] font-bold text-[#0F1621] group-hover:text-[#2B71F0] transition-colors leading-tight">{job.title}</h3>
                     <p className="text-[12px] text-[#9BA5B4] font-medium mt-1 uppercase tracking-wider">Started {getRelativeTime(job.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                     <button 
                        onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                        className="h-11 px-5 flex items-center justify-center rounded-xl bg-white border border-[#E8EAED] text-[#5A6474] font-bold text-[13px] hover:bg-[#F8F9FC] transition-all active:scale-95"
                     >
                        View Details
                     </button>
                     <button 
                        onClick={() => router.push(`/dashboard/jobs/${job.id}/shortlist`)}
                        className="h-11 px-6 flex items-center justify-center rounded-xl bg-[#2B71F0] text-white font-bold text-[13px] hover:bg-[#1A5CE0] transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center gap-2"
                     >
                        Results
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                     </button>
                     {!job.isScreened && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, job.id); }}
                         disabled={deletingId === job.id}
                         className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-[#E8EAED] text-[#9BA5B4] hover:text-[#DC2626] transition-all hover:bg-[#FEF2F2] active:scale-95"
                       >
                          {deletingId === job.id ? (
                             <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          ) : (
                             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          )}
                       </button>
                     )}
                  </div>
               </div>
             </div>
           ))
         )}
      </div>

      {/* Simplified Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
           <button 
             disabled={currentPage === 1}
             onClick={() => setCurrentPage(p => p - 1)}
             className="px-4 py-2 rounded-lg border border-[#E8EAED] text-[13px] font-bold text-[#5A6474] disabled:opacity-30 hover:bg-white transition-all"
           >
             Prev
           </button>
           <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={classNames(
                    "w-9 h-9 rounded-lg text-[13px] font-bold transition-all",
                    currentPage === p ? "bg-[#2B71F0] text-white" : "text-[#5A6474] hover:bg-white"
                  )}
                >
                  {p}
                </button>
              ))}
           </div>
           <button 
             disabled={currentPage === totalPages}
             onClick={() => setCurrentPage(p => p + 1)}
             className="px-4 py-2 rounded-lg border border-[#E8EAED] text-[13px] font-bold text-[#5A6474] disabled:opacity-30 hover:bg-white transition-all"
           >
             Next
           </button>
        </div>
      )}

      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Campaign"
        message="Are you sure you want to remove this recruitment campaign? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
