"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { thunkListJobs } from "@/store/slices/dashboardSlice";
import { apiListJobResults } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface ScreeningRun {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateCount: number;
  status: string;
  completedAt: string;
  createdAt: string;
}

export default function ScreeningsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [allScreenings, setAllScreenings] = useState<ScreeningRun[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function loadData() {
      const jobsAction = await dispatch(thunkListJobs() as any);
      if (thunkListJobs.fulfilled.match(jobsAction)) {
        const jobs = jobsAction.payload as any[];
        
        try {
          const resultsPromises = jobs.map((job: any) => 
            apiListJobResults(job.id).then(res => ({
              jobTitle: job.title,
              jobId: job.id,
              runs: res.data
            }))
          );
          
          const allResults = await Promise.all(resultsPromises);
          
          const flattened: ScreeningRun[] = allResults.flatMap(item => 
            item.runs.map((run: any) => ({
              ...run,
              jobTitle: item.jobTitle,
              jobId: item.jobId
            }))
          ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setAllScreenings(flattened);
        } catch (err) {
          console.error("Failed to fetch screening history:", err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [dispatch]);

  const filteredScreenings = useMemo(() => {
    return allScreenings.filter(s => 
      s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allScreenings, searchTerm]);

  const totalPages = Math.ceil(filteredScreenings.length / itemsPerPage);
  const paginatedScreenings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredScreenings.slice(start, start + itemsPerPage);
  }, [filteredScreenings, currentPage]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "succeeded": return "bg-[#F0FDF4] text-[#10B981] border-[#10B981]";
      case "partial":   return "bg-[#FEF9C3] text-[#D97706] border-[#FDE047]";
      case "failed":    return "bg-red-50 text-red-600 border-red-100";
      case "running":   return "bg-[#EEF4FF] text-[#2B71F0] border-[#2B71F0] animate-pulse";
      default:          return "bg-neutral-100 text-neutral-500 border-neutral-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#0F1621]">Screening History</h1>
        <p className="text-sm text-[#5A6474]">View and manage all your historical AI analysis results.</p>
      </div>

      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-5 border-b border-[#E8EAED] bg-[#F8F9FC]">
           <div className="relative w-full sm:w-96">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search history by job title..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8EAED] rounded-lg text-sm focus-ring outline-none"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '40%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="bg-[#F5F6FA] border-b border-[#E8EAED]">
              <tr className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-wider">
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4 text-center">Candidates</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6FA]">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-neutral-50 rounded w-1/2" /></td>
                  </tr>
                ))
              ) : paginatedScreenings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[#5A6474]">No screening history found.</td>
                </tr>
              ) : (
                paginatedScreenings.map((run) => (
                  <tr key={run.id} className="hover:bg-[#F8F9FC] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-[#0F1621] truncate">{run.jobTitle}</div>
                      <div className="text-[11px] text-[#9BA5B4] font-mono mt-0.5">ID: {run.id.slice(-8)}</div>
                    </td>
                    <td className="px-6 py-5 text-center text-[#5A6474] font-medium">
                      {run.candidateCount}
                    </td>
                    <td className="px-6 py-5 text-[#5A6474] text-sm">
                      {run.completedAt ? formatDistanceToNow(new Date(run.completedAt), { addSuffix: true }) : "In progress..."}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => router.push(`/dashboard/jobs/${run.jobId}/shortlist`)}
                        className="text-[#2B71F0] font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
