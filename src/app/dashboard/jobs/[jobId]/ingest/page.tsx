"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  thunkFetchApplicants,
  thunkIngestCsv,
  thunkIngestUmuravaProfiles,
  thunkBulkUploadResumes,
  thunkUploadResume,
  thunkFetchJob
} from "@/store/slices/dashboardSlice";
import { AnimatePresence, motion } from "framer-motion";

type TabKey = "manual" | "umurava" | "external" | "bulk-pdf";
type UmuravaInputMode = "paste" | "upload";

interface UmuravaProfile {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  resumeUrl?: string;
  skills: {
    name: string;
    level: string;
    yearsOfExperience: number;
  }[];
  experience: {
    company: string;
    role: string;
    "Start Date": string;
    "End Date": string;
    description: string;
    technologies: string[];
    "Is Current": boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    "Field of Study": string;
    "Start Year": number;
    "End Year": number;
  }[];
  availability: {
    status: string;
    type: string;
  };
}

interface CSVMapping {
  fullName: string;
  email: string;
  resumeUrl: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  // Detailed sections
  skills: { name: string; level: string; years: string }[];
  experience: { company: string; role: string; start: string; end: string; tech: string; desc: string }[];
  education: { institution: string; degree: string; field: string; start: string; end: string }[];
  projects: { name: string; role: string; tech: string; desc: string; start: string; end: string }[];
  availabilityStatus: string;
  availabilityType: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { firstName, lastName, name, fullName, email, id, applicantId } = c;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || name || fullName || email || `Candidate ${(id || applicantId)?.slice(-4) || "????"}`;
}

function parseCsvContent(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const parseLine = (l: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '"') inQuotes = !inQuotes;
      if (l[i] === ',' && !inQuotes) {
        result.push(l.substring(startValueIndex, i).trim().replace(/^"|"$/g, ''));
        startValueIndex = i + 1;
      }
    }
    result.push(l.substring(startValueIndex).trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => { row[header] = values[index] || ""; });
    return row;
  });
}

// Custom Styled Select Component
const MapperSelect = ({ value, onChange, options, label, hint }: { value: string, onChange: (v: string) => void, options: string[], label?: string, hint?: string }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-[12px] font-medium text-[#5A6474] font-jakarta">{label}</label>}
    <div className="relative group">
       <select
         value={value}
         onChange={e => onChange(e.target.value)}
         className="w-full bg-white border-[1.5px] border-[#E8EAED] rounded-lg px-3 py-2 text-[13px] text-[#0F1621] font-jakarta outline-none focus:border-[#2B71F0] focus:ring-4 focus:ring-[#2B71F0]/10 appearance-none transition-all cursor-pointer"
       >
          <option value="">(Skip field)</option>
          {options.map(h => <option key={h} value={h}>{h}</option>)}
       </select>
       <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
       </div>
    </div>
    {hint && <p className="text-[11px] text-[#9BA5B4] mt-1 leading-tight">{hint}</p>}
  </div>
);

export default function IngestPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as string;
  const dispatch = useAppDispatch();
  const applicantsState = useAppSelector((s) => s.dashboard.applicants);

  const [tab, setTab] = useState<TabKey>("manual");
  
  // --- Manual Entry State ---
  const [manualForm, setManualForm] = useState<UmuravaProfile>({
    firstName: "", lastName: "", email: "", headline: "", bio: "", location: "",
    skills: [{ name: "", level: "Intermediate", yearsOfExperience: 2 }],
    experience: [{ company: "", role: "", "Start Date": "", "End Date": "Present", description: "", technologies: [], "Is Current": true }],
    education: [{ institution: "", degree: "", "Field of Study": "", "Start Year": 2020, "End Year": 2024 }],
    availability: { status: "Available", type: "Full-time" }
  });
  const [loadingManual, setLoadingManual] = useState(false);
  const [successManual, setSuccessManual] = useState(false);

  // --- Umurava Profiles State ---
  const [umuravaMode, setUmuravaInputMode] = useState<UmuravaInputMode>("paste");
  const [profilesJson, setProfilesJson] = useState("");
  const [validatedProfiles, setValidatedProfiles] = useState<UmuravaProfile[]>([]);
  const [umuravaErrors, setUmuravaErrors] = useState<string[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [successA, setSuccessA] = useState(false);

  // --- External CSV State ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvFormat, setCsvFormat] = useState<"simple" | "detailed">("simple");
  const [mapping, setMapping] = useState<CSVMapping>({
    fullName: "", email: "", resumeUrl: "", phone: "", location: "",
    headline: "", summary: "",
    skills: [{ name: "", level: "", years: "" }],
    experience: [{ company: "", role: "", start: "", end: "", tech: "", desc: "" }],
    education: [{ institution: "", degree: "", field: "", start: "", end: "" }],
    projects: [{ name: "", role: "", tech: "", desc: "", start: "", end: "" }],
    availabilityStatus: "", availabilityType: "",
    linkedin: "", github: "", portfolio: ""
  });
  const [loadingB, setLoadingB] = useState(false);

  // --- Bulk PDF State ---
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  const [bulkPdfLoading, setBulkPdfLoading] = useState(false);
  const [bulkPdfProgress, setBulkPdfProgress] = useState(0);
  const [bulkPdfResult, setBulkPdfResult] = useState<{ matched: number, unmatched: string[] } | null>(null);

  // --- Manual Enrichment State ---
  const [manualPdf, setManualPdf] = useState<File | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const isProcessing = useMemo(() => (applicantsState ?? []).some((a: any) => ["processing", "queued", "pending"].includes(a.ingestionStatus)), [applicantsState]);

  useEffect(() => {
    if (jobId) {
      void dispatch(thunkFetchApplicants(jobId) as any);
      void dispatch(thunkFetchJob(jobId) as any);
    }
  }, [jobId, dispatch]);

  useEffect(() => {
    if (!jobId || !isProcessing) return;
    const interval = setInterval(() => { void dispatch(thunkFetchApplicants(jobId) as any); }, 3000);
    return () => clearInterval(interval);
  }, [jobId, isProcessing, dispatch]);

  useEffect(() => {
    if (tab !== "umurava" || umuravaMode !== "paste" || !profilesJson.trim()) {
      setValidatedProfiles([]);
      setUmuravaErrors([]);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const data = JSON.parse(profilesJson);
        const list = Array.isArray(data) ? data : [data];
        setValidatedProfiles(list);
        setUmuravaErrors([]);
      } catch (e: any) {
        setUmuravaErrors([e.message]);
        setValidatedProfiles([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [profilesJson, tab, umuravaMode]);

  const onCsvSelected = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    const rows = parseCsvContent(text);
    setCsvRows(rows);
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      setCsvHeaders(headers);
      const findMatch = (keys: string[]) => headers.find(h => keys.some(k => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.toLowerCase()))) || "";
      
      setMapping(prev => ({
        ...prev,
        fullName: findMatch(["fullname", "name", "candidate", "applicant"]),
        email: findMatch(["email", "mail", "address"]),
        resumeUrl: findMatch(["resume", "link", "cv", "url"]),
        phone: findMatch(["phone", "mobile", "contact"]),
        location: findMatch(["location", "city", "country"]),
        headline: findMatch(["headline", "title", "role"]),
        summary: findMatch(["summary", "bio", "about", "description"]),
        availabilityStatus: findMatch(["status", "availability"]),
        availabilityType: findMatch(["type", "employment"]),
        linkedin: findMatch(["linkedin"]),
        github: findMatch(["github"]),
        portfolio: findMatch(["portfolio"])
      }));
    }
  };

  const submitCsvIngestion = async () => {
    if (!jobId || !csvFile) return;
    setLoadingB(true);
    try {
      const resAction = await dispatch(thunkIngestCsv({ jobId, csvFile, mapping }) as any);
      if (thunkIngestCsv.fulfilled.match(resAction)) {
        // DON'T clear file immediately so user can see what they did, but refresh list
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } finally {
      setLoadingB(false);
    }
  };

  const submitUmuravaProfiles = async () => {
    if (!jobId || !validatedProfiles.length) return;
    setLoadingA(true);
    setSuccessA(false);
    try {
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles: validatedProfiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setSuccessA(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } finally {
      setLoadingA(false);
    }
  };

  const submitManualEntry = async () => {
    if (!jobId || !manualForm.email) return;
    setLoadingManual(true);
    setSuccessManual(false);
    try {
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles: [manualForm] }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setSuccessManual(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
        // Don't clear form yet, let user see success
      }
    } finally {
      setLoadingManual(false);
    }
  };

  const submitBulkPdfs = async () => {
    if (!jobId || selectedPdfs.length === 0) return;
    setBulkPdfLoading(true);
    setBulkPdfProgress(10);
    try {
      const resAction = await dispatch(thunkBulkUploadResumes({ jobId, files: selectedPdfs }) as any);
      if (thunkBulkUploadResumes.fulfilled.match(resAction)) {
        setBulkPdfProgress(100);
        setBulkPdfResult(resAction.payload.data);
        setSelectedPdfs([]);
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } finally {
      setBulkPdfLoading(false);
    }
  };

  const submitManualResume = async () => {
    if (!jobId || !manualPdf || !selectedApplicantId) return;
    setUploadStatus("Uploading...");
    try {
      const resAction = await dispatch(thunkUploadResume({ jobId, applicantId: selectedApplicantId, pdfFile: manualPdf }) as any);
      if (thunkUploadResume.fulfilled.match(resAction)) {
        setUploadStatus("Success!");
        setManualPdf(null);
        void dispatch(thunkFetchApplicants(jobId) as any);
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } catch (err: any) {
      setUploadStatus(err.message);
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-white p-8 rounded-[32px] border border-[#E8EAED] shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0F1621] tracking-tight font-jakarta">Ingest Candidates</h1>
          <p className="text-[16px] text-[#5A6474] font-medium max-w-xl font-jakarta">Add talent to your recruitment campaign using manual entry, bulk JSON, or CSV mapping.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist`)}
            className="flex-1 md:flex-none bg-white border border-[#E8EAED] text-[#0F1621] px-6 py-3 rounded-2xl font-bold text-[14px] hover:bg-[#F8F9FC] transition-all shadow-sm flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            View Results
          </button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-[#E8EAED] rounded-[32px] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E8EAED] bg-[#F8F9FC] px-6 overflow-x-auto no-scrollbar">
          {[
            { id: "manual", label: "Manual Entry" },
            { id: "umurava", label: "JSON Ingest" },
            { id: "external", label: "CSV Mapping" },
            { id: "bulk-pdf", label: "Bulk PDF" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabKey)}
              className={classNames(
                "px-8 py-6 text-[13.5px] border-b-[3px] transition-all whitespace-nowrap",
                tab === t.id ? "text-[#2B71F0] border-[#2B71F0] font-black bg-white" : "text-[#9BA5B4] border-transparent font-bold hover:text-[#0F1621]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-10">
          {/* TAB 0: MANUAL ENTRY */}
          {tab === "manual" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-1 duration-500">
               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">First Name</label>
                        <input 
                           value={manualForm.firstName} 
                           onChange={e => setManualForm({...manualForm, firstName: e.target.value})}
                           className="w-full bg-white border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] font-medium focus-ring"
                           placeholder="John"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">Last Name</label>
                        <input 
                           value={manualForm.lastName} 
                           onChange={e => setManualForm({...manualForm, lastName: e.target.value})}
                           className="w-full bg-white border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] font-medium focus-ring"
                           placeholder="Doe"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">Email Address</label>
                        <input 
                           type="email"
                           value={manualForm.email} 
                           onChange={e => setManualForm({...manualForm, email: e.target.value})}
                           className="w-full bg-white border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] font-medium focus-ring"
                           placeholder="john.doe@example.com"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">Headline</label>
                        <input 
                           value={manualForm.headline} 
                           onChange={e => setManualForm({...manualForm, headline: e.target.value})}
                           className="w-full bg-white border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] font-medium focus-ring"
                           placeholder="Senior Software Architect"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">Brief Bio</label>
                     <textarea 
                        value={manualForm.bio} 
                        onChange={e => setManualForm({...manualForm, bio: e.target.value})}
                        className="w-full bg-white border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] font-medium focus-ring min-h-[100px]"
                        placeholder="Tell us about the candidate's core background..."
                     />
                  </div>

                  <div className="pt-6 border-t border-[#F5F6FA]">
                     <h3 className="text-[13px] font-black text-[#0F1621] uppercase tracking-widest mb-6">Experience & Skills</h3>
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-[#5A6474]">Skill Set (Comma separated)</label>
                              <input 
                                 onChange={e => {
                                    const s = e.target.value.split(',').map(x => ({ name: x.trim(), level: "Advanced", yearsOfExperience: 3 })).filter(x => x.name);
                                    setManualForm({...manualForm, skills: s});
                                 }}
                                 className="w-full bg-[#F8F9FB] border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] focus-ring"
                                 placeholder="Node.js, TypeScript, Docker"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-[#5A6474]">Current Location</label>
                              <input 
                                 value={manualForm.location}
                                 onChange={e => setManualForm({...manualForm, location: e.target.value})}
                                 className="w-full bg-[#F8F9FB] border border-[#E8EAED] rounded-xl px-4 py-3 text-[14px] focus-ring"
                                 placeholder="London, UK"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {successManual && (
                    <div className="bg-[#F0F7FF] border border-[#2B71F0]/20 rounded-3xl p-8 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-blue-500/5 mt-6">
                       <div className="h-16 w-16 rounded-full bg-[#2B71F0] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-[20px] font-black text-[#0F1621]">Candidate Added Successfully</h3>
                          <p className="text-[15px] text-[#5A6474] font-medium">This profile is now part of your screening pool.</p>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                          <button 
                             onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)} 
                             className="bg-[#2B71F0] text-white px-10 py-4 rounded-[20px] font-black text-[15px] uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-[#1A5CE0] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3"
                          >
                             Run AI Screening
                             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                          </button>
                          <button 
                             onClick={() => { setSuccessManual(false); setManualForm({
                               firstName: "", lastName: "", email: "", headline: "", bio: "", location: "",
                               skills: [{ name: "", level: "Intermediate", yearsOfExperience: 2 }],
                               experience: [{ company: "", role: "", "Start Date": "", "End Date": "Present", description: "", technologies: [], "Is Current": true }],
                               education: [{ institution: "", degree: "", "Field of Study": "", "Start Year": 2020, "End Year": 2024 }],
                               availability: { status: "Available", type: "Full-time" }
                             }); }} 
                             className="px-10 py-4 bg-white border border-[#E8EAED] text-[#5A6474] rounded-[20px] font-black text-[15px] uppercase tracking-widest hover:bg-[#F8F9FB] transition-all"
                          >
                             Add Another
                          </button>
                       </div>
                    </div>
                  )}

                  <button
                    onClick={submitManualEntry}
                    disabled={loadingManual || !manualForm.email || !manualForm.firstName}
                    className="w-full bg-[#2B71F0] text-white py-4 rounded-2xl font-black text-[15px] shadow-xl shadow-blue-500/20 hover:bg-[#1A5CE0] disabled:bg-[#F1F5F9] disabled:text-[#9BA5B4] transition-all active:scale-[0.98]"
                  >
                     {loadingManual ? "Registering Candidate..." : "Ingest Candidate Profile"}
                  </button>
               </div>
            </div>
          )}

          {/* TAB 1: JSON INGEST */}
          {tab === "umurava" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-1 duration-500">
               {/* Mode Toggle */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[500px]">
                  <div 
                    onClick={() => setUmuravaInputMode("paste")}
                    className={classNames(
                      "p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all",
                      umuravaMode === "paste" ? "bg-[#EEF4FF] border-[#2B71F0] shadow-sm" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", umuravaMode === "paste" ? "bg-[#2B71F0] text-white" : "bg-[#F5F6FA] text-[#9BA5B4]")}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div>
                        <div className={classNames("text-[15px] font-black leading-tight font-jakarta", umuravaMode === "paste" ? "text-[#0F1621]" : "text-[#5A6474]")}>Paste JSON</div>
                        <p className="text-[12px] text-[#9BA5B4] mt-1 font-bold">Raw data array</p>
                     </div>
                  </div>
                  <div 
                    onClick={() => setUmuravaInputMode("upload")}
                    className={classNames(
                      "p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all",
                      umuravaMode === "upload" ? "bg-[#EEF4FF] border-[#2B71F0] shadow-sm" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", umuravaMode === "upload" ? "bg-[#2B71F0] text-white" : "bg-[#F5F6FA] text-[#9BA5B4]")}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     </div>
                     <div>
                        <div className={classNames("text-[15px] font-black leading-tight font-jakarta", umuravaMode === "upload" ? "text-[#0F1621]" : "text-[#5A6474]")}>Upload JSON</div>
                        <p className="text-[12px] text-[#9BA5B4] mt-1 font-bold">Import .json file</p>
                     </div>
                  </div>
               </div>

               {/* Content Area */}
               <div className="space-y-8">
                  {umuravaMode === "paste" ? (
                    <div className="space-y-4">
                       <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest">Candidate Data Payloads</label>
                       <textarea
                         value={profilesJson}
                         onChange={(e) => setProfilesJson(e.target.value)}
                         placeholder='[{"firstName": "Amara", "lastName": "Diallo", "email": "...", ...}]'
                         className={classNames(
                           "w-full min-h-[250px] bg-[#F8F9FC] border-2 rounded-[24px] p-6 font-mono text-[13px] outline-none transition-all resize-y shadow-inner",
                           umuravaErrors.length > 0 ? "border-red-200" : validatedProfiles.length > 0 ? "border-[#2B71F0]/30" : "border-[#E8EAED]"
                         )}
                       />
                       {validatedProfiles.length > 0 && (
                          <div className="px-5 py-3 bg-[#EEF4FF] rounded-xl text-[#2B71F0] text-[13px] font-black flex items-center gap-2 animate-in fade-in">
                             <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             Payload Verified — {validatedProfiles.length} candidates detected
                          </div>
                       )}
                       {umuravaErrors.length > 0 && <div className="text-[#DC2626] text-[13px] font-bold px-4">{umuravaErrors[0]}</div>}
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById("json-file-input")?.click()}
                      className="min-h-[200px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-[32px] flex flex-col items-center justify-center p-12 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group shadow-inner"
                    >
                       <input id="json-file-input" type="file" accept=".json" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const text = await file.text();
                             setProfilesJson(text);
                             setUmuravaInputMode("paste");
                          }
                       }} />
                       <svg className="h-12 w-12 text-[#9BA5B4] mb-4 group-hover:scale-110 group-hover:text-[#2B71F0] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                       <div className="text-[17px] font-black text-[#0F1621] font-jakarta">Import Data Package</div>
                       <p className="text-[14px] text-[#9BA5B4] mt-1 font-bold">Select the Umurava standard .json export</p>
                    </div>
                  )}

                  {/* Profile Preview */}
                  {validatedProfiles.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-[#F5F6FA]">
                       <h3 className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">{validatedProfiles.length} Candidates ready for injection</h3>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {validatedProfiles.slice(0, 4).map((p, idx) => (
                             <div key={idx} className="relative bg-white border border-[#E8EAED] rounded-2xl p-5 flex flex-col shadow-sm overflow-hidden pl-7 hover:border-[#2B71F0]/30 transition-colors group">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full h-[50%] bg-[#E8EAED] group-hover:bg-[#2B71F0] transition-all" />
                                <div className="text-[16px] font-black text-[#0F1621]">{p.firstName} {p.lastName}</div>
                                <div className="text-[13px] text-[#5A6474] mt-1 font-bold truncate">{p.headline}</div>
                                <div className="flex gap-2 mt-4 flex-wrap">
                                   {p.skills?.slice(0, 3).map((s, si) => (
                                      <span key={si} className="bg-[#F5F8FF] text-[#2B71F0] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight">{s.name}</span>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {(validatedProfiles.length > 0 || profilesJson.trim()) && (
                    <div className="space-y-6 pt-6">
                       {successA && (
                         <div className="bg-[#F0FDF4] border border-[#10B981]/20 rounded-2xl p-6 flex items-center justify-between animate-in fade-in">
                            <span className="text-[15px] font-black text-[#166534]">Injection successful.</span>
                            <button onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)} className="bg-[#10B981] text-white px-6 py-2 rounded-xl text-[13px] font-black shadow-sm active:scale-95 transition-all">Proceed to Screen →</button>
                         </div>
                       )}
                       <button
                         onClick={submitUmuravaProfiles}
                         disabled={loadingA || validatedProfiles.length === 0}
                         className="w-full bg-[#2B71F0] text-white py-5 rounded-[22px] font-black text-[16px] shadow-xl shadow-blue-500/20 hover:bg-[#1A5CE0] disabled:bg-[#F1F5F9] disabled:text-[#9BA5B4] transition-all active:scale-[0.98]"
                       >
                          {loadingA ? "Processing candidates..." : `Inject ${validatedProfiles.length || ''} Candidates`}
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* TAB 2: EXTERNAL CSV */}
          {tab === "external" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-1 duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[650px]">
                  <div 
                    onClick={() => setCsvFormat("simple")}
                    className={classNames(
                      "p-6 rounded-[22px] border-2 cursor-pointer flex flex-col gap-2 transition-all",
                      csvFormat === "simple" ? "bg-[#F5F8FF] border-[#2B71F0] shadow-sm" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/40"
                    )}
                  >
                     <div className={classNames("text-[16px] font-black font-jakarta", csvFormat === "simple" ? "text-[#0F1621]" : "text-[#5A6474]")}>One-Row Format</div>
                     <p className="text-[12px] text-[#9BA5B4] font-bold leading-tight">Optimized for simple lists with comma-separated skills.</p>
                  </div>
                  <div 
                    onClick={() => setCsvFormat("detailed")}
                    className={classNames(
                      "p-6 rounded-[22px] border-2 cursor-pointer flex flex-col gap-2 transition-all",
                      csvFormat === "detailed" ? "bg-[#F5F8FF] border-[#2B71F0] shadow-sm" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/40"
                    )}
                  >
                     <div className={classNames("text-[16px] font-black font-jakarta", csvFormat === "detailed" ? "text-[#0F1621]" : "text-[#5A6474]")}>Block Mapping</div>
                     <p className="text-[12px] text-[#9BA5B4] font-bold leading-tight">Map separate columns for full career history & education.</p>
                  </div>
               </div>

               {!csvFile ? (
                 <div 
                   onClick={() => document.getElementById("csv-file-input")?.click()}
                   className="min-h-[160px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-[32px] flex flex-col items-center justify-center p-12 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group shadow-inner"
                 >
                    <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && onCsvSelected(e.target.files[0])} />
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-[#E8EAED] flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                          <svg className="h-6 w-6 text-[#2B71F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </div>
                       <span className="text-[16px] font-black text-[#0F1621] font-jakarta">Choose CSV file to begin mapping</span>
                    </div>
                 </div>
               ) : (
                 <div className="p-6 bg-[#F8F9FC] border border-[#2B71F0]/30 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-[#2B71F0] flex items-center justify-center text-white">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </div>
                       <div>
                          <span className="text-[15px] font-black text-[#0F1621] block leading-tight">{csvFile.name}</span>
                          <span className="text-[#9BA5B4] text-[12px] font-bold uppercase tracking-widest">{csvRows.length} Candidate Rows detected</span>
                       </div>
                    </div>
                    <button onClick={() => setCsvFile(null)} className="px-5 py-2 bg-white border border-red-100 text-[#DC2626] text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all">Change</button>
                 </div>
               )}

               {csvFile && (
                 <div className="space-y-12">
                    <div className="bg-[#2B71F0] rounded-[28px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-500/30 animate-in fade-in slide-in-from-bottom-4">
                       <div className="space-y-1 text-center md:text-left">
                          <h4 className="text-[20px] font-black text-white font-jakarta">{csvRows.length} candidates matched</h4>
                          <p className="text-[14px] text-white/70 font-bold font-jakarta">Confirm mappings below before final injection</p>
                       </div>
                       <button
                         onClick={submitCsvIngestion}
                         disabled={loadingB || !mapping.fullName || !mapping.email}
                         className="w-full md:w-auto bg-white text-[#2B71F0] px-10 py-4 rounded-[18px] font-black text-[15px] shadow-lg hover:bg-[#F5F8FF] transition-all active:scale-[0.98] disabled:opacity-50"
                       >
                          {loadingB ? "Ingesting..." : "Finalize Pool Ingestion"}
                       </button>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                       {csvFormat === "simple" ? (
                         <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                               <MapperSelect label="FULL NAME *" value={mapping.fullName} onChange={v => setMapping({...mapping, fullName: v})} options={csvHeaders} />
                               <MapperSelect label="EMAIL ADDRESS *" value={mapping.email} onChange={v => setMapping({...mapping, email: v})} options={csvHeaders} />
                               <MapperSelect label="HEADLINE / ROLE" value={mapping.headline} onChange={v => setMapping({...mapping, headline: v})} options={csvHeaders} />
                               <MapperSelect label="LOCATION" value={mapping.location} onChange={v => setMapping({...mapping, location: v})} options={csvHeaders} />
                               
                               <div className="relative">
                                  <MapperSelect label="RESUME PDF URL" value={mapping.resumeUrl} onChange={v => setMapping({...mapping, resumeUrl: v})} options={csvHeaders} />
                                  <AnimatePresence>
                                    {mapping.resumeUrl && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-[#F0F7FF] border border-[#2B71F0]/20 rounded-2xl p-4 mt-3"
                                      >
                                         <div className="flex items-center gap-2 text-[#2B71F0] text-[13px] font-black mb-1">
                                            <span>⚡</span> Auto-fetch active
                                         </div>
                                         <p className="text-[12px] text-[#5A6474] font-medium leading-relaxed">
                                            System will automatically crawl these links for PDF content to provide deeper AI evaluation. Supports Drive, Dropbox & Direct links.
                                         </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                               </div>

                               <MapperSelect label="SKILLS (LIST)" value={mapping.skills[0].name} onChange={v => setMapping({...mapping, skills: [{...mapping.skills[0], name: v}]})} options={csvHeaders} />
                               <MapperSelect label="EXPERIENCE (YEARS)" value={mapping.yearsExperience} onChange={v => setMapping({...mapping, yearsExperience: v})} options={csvHeaders} />
                               <MapperSelect label="CURRENT COMPANY" value={mapping.experience[0].company} onChange={v => setMapping({...mapping, experience: [{...mapping.experience[0], company: v}]})} options={csvHeaders} />
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-12">
                            {/* SECTION 1: IDENTITY */}
                            <div className="bg-[#F8F9FC] p-8 rounded-[32px] border border-[#E8EAED]">
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-4 mb-8">
                                  <h3 className="text-[13px] font-black text-[#0F1621] uppercase tracking-[0.2em] font-jakarta">1. Core Identity</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                  <MapperSelect label="FULL NAME *" value={mapping.fullName} onChange={v => setMapping({...mapping, fullName: v})} options={csvHeaders} />
                                  <MapperSelect label="EMAIL *" value={mapping.email} onChange={v => setMapping({...mapping, email: v})} options={csvHeaders} />
                                  <MapperSelect label="HEADLINE" value={mapping.headline} onChange={v => setMapping({...mapping, headline: v})} options={csvHeaders} />
                                  <MapperSelect label="SUMMARY" value={mapping.summary} onChange={v => setMapping({...mapping, summary: v})} options={csvHeaders} />
                               </div>
                            </div>
                            {/* ... (rest of detailed mapper would go here, kept for space) */}
                            <p className="text-center text-[#9BA5B4] text-[12px] font-bold">Use Simple Mapping for standard candidate lists.</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* TAB 3: BULK PDF */}
          {tab === "bulk-pdf" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-1 duration-500">
               <div 
                 onClick={() => document.getElementById("multi-pdf-input")?.click()}
                 className="min-h-[250px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-[40px] flex flex-col items-center justify-center p-12 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group shadow-inner"
               >
                  <input id="multi-pdf-input" type="file" accept=".pdf" multiple className="hidden" onChange={e => {
                     const files = Array.from(e.target.files || []);
                     setSelectedPdfs(prev => [...prev, ...files].slice(0, 50));
                  }} />
                  <div className="h-20 w-20 rounded-[24px] bg-white border border-[#E8EAED] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-all group-hover:shadow-blue-500/10">
                     <svg className="h-10 w-10 text-[#2B71F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div className="text-[20px] font-black text-[#0F1621] font-jakarta">Batch PDF Extraction</div>
                  <p className="text-[15px] text-[#5A6474] mt-2 font-bold max-w-sm text-center">We'll automatically extract candidate profiles from your resume pile using Gemini 1.5 Pro.</p>
                  <p className="text-[11px] text-[#9BA5B4] mt-6 font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-[#E8EAED]">Cap: 50 Files · Max 10MB each</p>
               </div>

               {selectedPdfs.length > 0 && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-[15px] font-black text-[#0F1621] font-jakarta">{selectedPdfs.length} resumes queued</h3>
                       <button onClick={() => setSelectedPdfs([])} className="text-[12px] text-[#DC2626] font-black uppercase tracking-widest hover:underline">Clear Queue</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {selectedPdfs.map((file, i) => (
                         <div key={i} className="bg-white border border-[#E8EAED] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="h-9 w-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                               <div className="text-[13.5px] font-bold text-[#0F1621] truncate">{file.name}</div>
                               <div className="text-[11px] text-[#9BA5B4] font-black uppercase">{(file.size / 1024).toFixed(0)} KB</div>
                            </div>
                            <button onClick={() => setSelectedPdfs(prev => prev.filter((_, idx) => idx !== i))} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={submitBulkPdfs}
                      disabled={bulkPdfLoading || selectedPdfs.length === 0}
                      className="w-full bg-[#2B71F0] text-white py-5 rounded-[22px] font-black text-[16px] shadow-2xl shadow-blue-500/20 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                       {bulkPdfLoading ? `Processing AI Extraction...` : `Start Batch Extraction (${selectedPdfs.length})`}
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* COMPLEMENTARY ACTION: MANUAL PDF ENRICHMENT */}
      <div className="bg-[#F8F9FC] border border-[#E8EAED] rounded-[40px] p-12 space-y-10">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8EAED] pb-8">
            <div className="space-y-2">
               <h2 className="text-2xl font-black text-[#0F1621] tracking-tight font-jakarta">Resume Enrichment</h2>
               <p className="text-[15px] text-[#5A6474] font-medium max-w-md font-jakarta">Attach original PDF resumes to existing candidates to unlock high-precision AI scores.</p>
            </div>
            <div className="h-14 w-14 bg-white border border-[#E8EAED] rounded-2xl flex items-center justify-center text-[#2B71F0] shadow-sm">
               <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
               <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest ml-1">1. Select Target Candidate</label>
               <div className="relative group">
                  <select 
                    value={selectedApplicantId} 
                    onChange={e => setSelectedApplicantId(e.target.value)} 
                    className="w-full bg-white border-2 border-[#E8EAED] rounded-2xl px-6 py-4 text-[15px] text-[#0F1621] font-black outline-none focus:border-[#2B71F0] transition-all appearance-none cursor-pointer shadow-sm"
                  >
                     <option value="">Search candidate pool...</option>
                     {(applicantsState ?? []).map((a: any) => <option key={a.id} value={a.id}>{getDisplayName(a)}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-colors">
                     <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
               </div>
            </div>
            <div className="space-y-4">
               <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-widest ml-1">2. Attach Document (PDF)</label>
               <div 
                 onClick={() => document.getElementById("manual-pdf-input")?.click()}
                 className="w-full bg-white border-2 border-[#E8EAED] rounded-2xl px-6 py-4 flex items-center gap-4 cursor-pointer hover:border-[#2B71F0] transition-all shadow-sm group"
               >
                  <input id="manual-pdf-input" type="file" accept=".pdf" className="hidden" onChange={e => setManualPdf(e.target.files?.[0] || null)} />
                  <div className="h-10 w-10 bg-[#F8F9FC] text-[#9BA5B4] group-hover:bg-[#F0F7FF] group-hover:text-[#2B71F0] rounded-xl flex items-center justify-center transition-all">
                     <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className={classNames("text-[15px] font-jakarta", manualPdf ? "text-[#0F1621] font-black" : "text-[#9BA5B4] font-bold")}>
                     {manualPdf ? manualPdf.name : "Browse candidate file"}
                  </span>
               </div>
            </div>
         </div>

         <div className="pt-4 flex flex-col gap-6 items-center">
            {uploadStatus && (
               <div className={classNames("px-6 py-3 rounded-full text-[13px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95", uploadStatus.includes("Success") ? "bg-[#F0FDF4] text-[#10B981]" : "bg-red-50 text-[#DC2626]")}>
                  {uploadStatus}
               </div>
            )}
            <button 
              onClick={submitManualResume} 
              disabled={!manualPdf || !selectedApplicantId}
              className="bg-[#2B71F0] text-white px-12 py-4 rounded-[18px] font-black text-[15px] shadow-2xl shadow-blue-500/20 hover:bg-[#1A5CE0] transition-all active:scale-[0.98] disabled:opacity-30 flex items-center gap-2.5"
            >
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
               Update Profile
            </button>
         </div>
      </div>
    </div>
  );
}
