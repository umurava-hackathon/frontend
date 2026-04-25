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

type TabKey = "umurava" | "external" | "bulk-pdf";
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

  const [tab, setTab] = useState<TabKey>("umurava");
  
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
        setCsvFile(null);
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
        setProfilesJson("");
        setSuccessA(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } finally {
      setLoadingA(false);
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

  // Repeater Helpers
  const addSkill = () => { if (mapping.skills.length < 5) setMapping(p => ({ ...p, skills: [...p.skills, { name: "", level: "", years: "" }] })); };
  const removeSkill = (i: number) => setMapping(p => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }));
  
  const addExperience = () => { if (mapping.experience.length < 3) setMapping(p => ({ ...p, experience: [...p.experience, { company: "", role: "", start: "", end: "", tech: "", desc: "" }] })); };
  const removeExperience = (i: number) => setMapping(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));

  const addEducation = () => { if (mapping.education.length < 2) setMapping(p => ({ ...p, education: [...p.education, { institution: "", degree: "", field: "", start: "", end: "" }] })); };
  const removeEducation = (i: number) => setMapping(p => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));

  const addProject = () => { if (mapping.projects.length < 3) setMapping(p => ({ ...p, projects: [...p.projects, { name: "", role: "", tech: "", desc: "", start: "", end: "" }] })); };
  const removeProject = (i: number) => setMapping(p => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621] font-jakarta">Ingest Candidates</h1>
          <p className="text-sm text-[#5A6474] font-jakarta">Add talent to your pipeline using scalable bulk ingestion or manual upload.</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/jobs/${jobId}/shortlist`)}
          className="w-full sm:w-auto bg-white border border-[#E8EAED] text-[#0F1621] px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#F8F9FC] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          View Shortlist
        </button>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E8EAED] bg-[#F8F9FC] px-4 overflow-x-auto no-scrollbar">
          {[
            { id: "umurava", label: "Umurava Profiles" },
            { id: "external", label: "External CSV" },
            { id: "bulk-pdf", label: "Bulk PDF Upload" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabKey)}
              className={classNames(
                "px-6 py-5 text-sm border-b-2 transition-all capitalize whitespace-nowrap",
                tab === t.id ? "text-[#2B71F0] border-[#2B71F0] font-bold bg-white" : "text-[#5A6474] border-transparent font-medium hover:text-[#0F1621]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* TAB 1: UMURAVA PROFILES */}
          {tab === "umurava" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-300">
               {/* Mode Toggle */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[500px]">
                  <div 
                    onClick={() => setUmuravaInputMode("paste")}
                    className={classNames(
                      "p-4 rounded-[10px] border-[1.5px] cursor-pointer flex items-center gap-3 transition-all",
                      umuravaMode === "paste" ? "bg-[#EEF4FF] border-[#2B71F0]" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", umuravaMode === "paste" ? "text-[#2B71F0]" : "text-[#9BA5B4]")}>
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div>
                        <div className={classNames("text-[14px] font-semibold leading-tight font-jakarta", umuravaMode === "paste" ? "text-[#0F1621]" : "text-[#5A6474]")}>Paste JSON</div>
                        <p className="text-[12px] text-[#9BA5B4] mt-0.5 font-jakarta">Paste a JSON array</p>
                     </div>
                  </div>
                  <div 
                    onClick={() => setUmuravaInputMode("upload")}
                    className={classNames(
                      "p-4 rounded-[10px] border-[1.5px] cursor-pointer flex items-center gap-3 transition-all",
                      umuravaMode === "upload" ? "bg-[#EEF4FF] border-[#2B71F0]" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", umuravaMode === "upload" ? "text-[#2B71F0]" : "text-[#9BA5B4]")}>
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     </div>
                     <div>
                        <div className={classNames("text-[14px] font-semibold leading-tight font-jakarta", umuravaMode === "upload" ? "text-[#0F1621]" : "text-[#5A6474]")}>Upload File</div>
                        <p className="text-[12px] text-[#9BA5B4] mt-0.5 font-jakarta">Upload a .json file</p>
                     </div>
                  </div>
               </div>

               {/* Content Area */}
               <div className="space-y-6">
                  {umuravaMode === "paste" ? (
                    <div className="space-y-3">
                       <label className="text-[13px] font-medium text-[#5A6474] font-jakarta">Paste candidate profiles (JSON array)</label>
                       <textarea
                         value={profilesJson}
                         onChange={(e) => setProfilesJson(e.target.value)}
                         placeholder='[{"firstName": "Amara", "lastName": "Diallo", "email": "...", ...}]'
                         className={classNames(
                           "w-full min-h-[200px] bg-[#F8F9FC] border-[1.5px] rounded-lg p-4 font-mono text-[13px] outline-none transition-all resize-y",
                           umuravaErrors.length > 0 ? "border-[#DC2626]" : validatedProfiles.length > 0 ? "border-[#2B71F0]" : "border-[#E8EAED]"
                         )}
                       />
                       {validatedProfiles.length > 0 && (
                          <div className="text-[#2B71F0] text-[13px] font-medium flex items-center gap-1.5 animate-in fade-in">
                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             Valid JSON — {validatedProfiles.length} profiles detected
                          </div>
                       )}
                       {umuravaErrors.length > 0 && <div className="text-[#DC2626] text-[13px]">{umuravaErrors[0]}</div>}
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById("json-file-input")?.click()}
                      className="min-height-[160px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-lg flex flex-col items-center justify-center p-10 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group"
                    >
                       <input id="json-file-input" type="file" accept=".json" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const text = await file.text();
                             setProfilesJson(text);
                             setUmuravaInputMode("paste");
                          }
                       }} />
                       <svg className="h-8 w-8 text-[#9BA5B4] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                       <div className="text-[14px] font-semibold text-[#0F1621] font-jakarta">Drop your .json file here</div>
                       <p className="text-[13px] text-[#9BA5B4] mt-1 font-jakarta">or click to browse</p>
                    </div>
                  )}

                  {/* Profile Preview Cards */}
                  {validatedProfiles.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-[#F1F5F9] animate-in fade-in slide-in-from-bottom-2 duration-500">
                       <h3 className="text-[14px] font-semibold text-[#0F1621] font-jakarta">{validatedProfiles.length} profiles ready to ingest</h3>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {validatedProfiles.slice(0, 4).map((p, idx) => (
                             <div key={idx} className="bg-white border border-[#E8EAED] rounded-[10px] p-4 flex flex-col shadow-sm">
                                <div className="text-[14px] font-semibold text-[#0F1621] font-jakarta">{p.firstName} {p.lastName}</div>
                                <div className="text-[13px] text-[#5A6474] mt-0.5 truncate font-jakarta">{p.headline}</div>
                                <div className="text-[12px] text-[#9BA5B4] mt-0.5 font-jakarta">{p.location}</div>
                                <div className="flex gap-1.5 mt-3 flex-wrap">
                                   {p.skills?.slice(0, 3).map((s, si) => (
                                      <span key={si} className="bg-[#EEF4FF] text-[#2B71F0] px-[10px] py-[2px] rounded-full text-[11px] font-medium font-jakarta">{s.name}</span>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Ingest Button A */}
                  {(validatedProfiles.length > 0 || profilesJson.trim()) && (
                    <div className="space-y-4 pt-4">
                       {successA && (
                         <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-lg p-4 flex items-center justify-between animate-in fade-in">
                            <span className="text-[14px] font-medium text-[#166534] font-jakarta">Profiles ingested successfully.</span>
                            <button onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)} className="text-[13px] font-bold text-[#166534] hover:underline font-jakarta">Run screening →</button>
                         </div>
                       )}
                       <button
                         onClick={submitUmuravaProfiles}
                         disabled={loadingA || validatedProfiles.length === 0}
                         className="w-full bg-[#2B71F0] text-white py-4 rounded-xl font-bold text-[15px] shadow-sm hover:bg-[#1A5CE0] disabled:bg-[#F1F5F9] disabled:text-[#9BA5B4] transition-all flex items-center justify-center gap-3 font-jakarta"
                       >
                          {loadingA ? "Ingesting..." : `Ingest ${validatedProfiles.length || ''} profiles`}
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* TAB 2: EXTERNAL CSV */}
          {tab === "external" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-1 duration-300">
               {/* CSV Format Selector */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[600px]">
                  <div 
                    onClick={() => setCsvFormat("simple")}
                    className={classNames(
                      "p-4 rounded-[10px] border-[1.5px] cursor-pointer flex flex-col gap-1 transition-all",
                      csvFormat === "simple" ? "bg-[#EEF4FF] border-[#2B71F0]" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("text-[14px] font-semibold font-jakarta", csvFormat === "simple" ? "text-[#0F1621]" : "text-[#5A6474]")}>Simple format</div>
                     <p className="text-[12px] text-[#9BA5B4] font-jakarta">One row per candidate · Skills in single cells</p>
                  </div>
                  <div 
                    onClick={() => setCsvFormat("detailed")}
                    className={classNames(
                      "p-4 rounded-[10px] border-[1.5px] cursor-pointer flex flex-col gap-1 transition-all",
                      csvFormat === "detailed" ? "bg-[#EEF4FF] border-[#2B71F0]" : "bg-white border-[#E8EAED] hover:border-[#2B71F0]/50"
                    )}
                  >
                     <div className={classNames("text-[14px] font-semibold font-jakarta", csvFormat === "detailed" ? "text-[#0F1621]" : "text-[#5A6474]")}>Detailed format</div>
                     <p className="text-[12px] text-[#9BA5B4] font-jakarta">Separate columns per skill, role, project</p>
                  </div>
               </div>

               {/* CSV Upload Zone */}
               {!csvFile ? (
                 <div 
                   onClick={() => document.getElementById("csv-file-input")?.click()}
                   className="min-h-[100px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-lg flex flex-col items-center justify-center p-8 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group"
                 >
                    <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && onCsvSelected(e.target.files[0])} />
                    <div className="flex items-center gap-3">
                       <svg className="h-6 w-6 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       <span className="text-[14px] font-semibold text-[#0F1621] font-jakarta">Choose CSV file to begin mapping</span>
                    </div>
                 </div>
               ) : (
                 <div className="p-4 bg-white border border-[#2B71F0] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="text-[14px] font-bold text-[#0F1621] font-jakarta">{csvFile.name}</span>
                       <span className="text-[#9BA5B4] text-[13px] font-jakarta">{csvRows.length} rows detected</span>
                    </div>
                    <button onClick={() => setCsvFile(null)} className="text-[#DC2626] text-[12px] font-bold uppercase tracking-wider hover:underline font-jakarta">Change file</button>
                 </div>
               )}

               {csvFile && (
                 <div className="space-y-10">
                    <div className="bg-[#EEF4FF] border border-[#BBCFFF] rounded-[10px] p-5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                       <div className="space-y-1">
                          <h4 className="text-[14px] font-semibold text-[#0F1621] font-jakarta">{csvRows.length} candidates ready</h4>
                          <p className="text-[13px] text-[#5A6474] font-jakarta">Mappings validated — ready to ingest</p>
                       </div>
                       <button
                         onClick={submitCsvIngestion}
                         disabled={loadingB || !mapping.fullName || !mapping.email}
                         className="bg-[#2B71F0] text-white px-[20px] py-[10px] rounded-lg font-semibold text-[14px] shadow-sm hover:bg-[#1A5CE0] transition-all font-jakarta"
                       >
                          {loadingB ? "Processing..." : "Ingest Pool"}
                       </button>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                       {csvFormat === "simple" ? (
                         <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                               <MapperSelect label="FULL NAME *" value={mapping.fullName} onChange={v => setMapping({...mapping, fullName: v})} options={csvHeaders} />
                               <MapperSelect label="EMAIL *" value={mapping.email} onChange={v => setMapping({...mapping, email: v})} options={csvHeaders} />
                               <MapperSelect label="HEADLINE" value={mapping.headline} onChange={v => setMapping({...mapping, headline: v})} options={csvHeaders} />
                               <MapperSelect label="LOCATION" value={mapping.location} onChange={v => setMapping({...mapping, location: v})} options={csvHeaders} />
                               
                               <div className="relative">
                                  <MapperSelect label="RESUME URL" value={mapping.resumeUrl} onChange={v => setMapping({...mapping, resumeUrl: v})} options={csvHeaders} />
                                  <AnimatePresence>
                                    {mapping.resumeUrl && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-[#EEF4FF] border border-[#BBCFFF] rounded-lg p-3 mt-2"
                                      >
                                         <div className="flex items-center gap-2 text-[#1547C0] text-[13px] font-semibold font-jakarta mb-1">
                                            <span>⚡</span> Auto-fetch enabled
                                         </div>
                                         <p className="text-[12px] text-[#2B71F0] leading-relaxed font-jakarta">
                                            After ingestion, we'll automatically fetch and parse each resume URL using Gemini. Candidates get richer AI scoring. Supports direct PDF links, Google Drive, and Dropbox.
                                         </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                               </div>

                               <MapperSelect label="SKILLS (comma-separated)" value={mapping.skills[0].name} onChange={v => setMapping({...mapping, skills: [{...mapping.skills[0], name: v}]})} options={csvHeaders} />
                               <MapperSelect label="SKILL LEVELS (comma-separated)" value={mapping.skills[0].level} onChange={v => setMapping({...mapping, skills: [{...mapping.skills[0], level: v}]})} options={csvHeaders} />
                               <MapperSelect label="YEARS EXPERIENCE" value={mapping.yearsExperience} onChange={v => setMapping({...mapping, yearsExperience: v})} options={csvHeaders} />
                               <MapperSelect label="CURRENT COMPANY" value={mapping.experience[0].company} onChange={v => setMapping({...mapping, experience: [{...mapping.experience[0], company: v}]})} options={csvHeaders} />
                               <MapperSelect label="CURRENT ROLE" value={mapping.experience[0].role} onChange={v => setMapping({...mapping, experience: [{...mapping.experience[0], role: v}]})} options={csvHeaders} />
                               <MapperSelect label="EXPERIENCE SUMMARY" value={mapping.experience[0].desc} onChange={v => setMapping({...mapping, experience: [{...mapping.experience[0], desc: v}]})} options={csvHeaders} />
                               <MapperSelect label="TECHNOLOGIES (comma-separated)" value={mapping.experience[0].tech} onChange={v => setMapping({...mapping, experience: [{...mapping.experience[0], tech: v}]})} options={csvHeaders} />
                               <MapperSelect label="INSTITUTION" value={mapping.education[0].institution} onChange={v => setMapping({...mapping, education: [{...mapping.education[0], institution: v}]})} options={csvHeaders} />
                               <MapperSelect label="DEGREE" value={mapping.education[0].degree} onChange={v => setMapping({...mapping, education: [{...mapping.education[0], degree: v}]})} options={csvHeaders} />
                               <MapperSelect label="FIELD OF STUDY" value={mapping.education[0].field} onChange={v => setMapping({...mapping, education: [{...mapping.education[0], field: v}]})} options={csvHeaders} />
                               <MapperSelect label="AVAILABILITY STATUS" value={mapping.availabilityStatus} onChange={v => setMapping({...mapping, availabilityStatus: v})} options={csvHeaders} />
                               <MapperSelect label="EMPLOYMENT TYPE" value={mapping.availabilityType} onChange={v => setMapping({...mapping, availabilityType: v})} options={csvHeaders} />
                            </div>
                            <div className="bg-[#F8F9FC] border border-[#E8EAED] rounded-lg p-4 text-[12px] text-[#9BA5B4] font-jakarta">
                               Simple format creates one experience entry and one education entry per candidate. For richer profiles with multiple roles and projects, use Detailed format or Umurava Profiles.
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-12">
                            {/* SECTION 1: IDENTITY */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">1. Identity & Context</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                                  <MapperSelect label="FULL NAME *" value={mapping.fullName} onChange={v => setMapping({...mapping, fullName: v})} options={csvHeaders} />
                                  <MapperSelect label="EMAIL *" value={mapping.email} onChange={v => setMapping({...mapping, email: v})} options={csvHeaders} />
                                  <MapperSelect label="PHONE" value={mapping.phone} onChange={v => setMapping({...mapping, phone: v})} options={csvHeaders} />
                                  <MapperSelect label="LOCATION" value={mapping.location} onChange={v => setMapping({...mapping, location: v})} options={csvHeaders} />
                                  <MapperSelect label="HEADLINE" value={mapping.headline} onChange={v => setMapping({...mapping, headline: v})} options={csvHeaders} />
                                  <MapperSelect label="SUMMARY" value={mapping.summary} onChange={v => setMapping({...mapping, summary: v})} options={csvHeaders} />
                                  <div className="relative col-span-1">
                                    <MapperSelect label="RESUME URL" value={mapping.resumeUrl} onChange={v => setMapping({...mapping, resumeUrl: v})} options={csvHeaders} />
                                    <AnimatePresence>
                                      {mapping.resumeUrl && (
                                        <motion.div 
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0 }}
                                          className="bg-[#EEF4FF] border border-[#BBCFFF] rounded-lg p-3 mt-2"
                                        >
                                          <div className="flex items-center gap-2 text-[#1547C0] text-[13px] font-semibold font-jakarta mb-1">
                                              <span>⚡</span> Auto-fetch enabled
                                          </div>
                                          <p className="text-[12px] text-[#2B71F0] leading-relaxed font-jakarta">
                                              After ingestion, we'll automatically fetch and parse each resume URL using Gemini. Candidates get richer AI scoring. Supports direct PDF links, Google Drive, and Dropbox.
                                          </p>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                               </div>
                            </div>

                            {/* SECTION 2: SKILLS */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">2. Skills</h3>
                                  <span onClick={addSkill} className="text-[12px] font-medium text-[#2B71F0] hover:underline cursor-pointer font-jakarta">+ ADD COLUMN</span>
                               </div>
                               <div className="space-y-4">
                                  {mapping.skills.map((s, i) => (
                                     <div key={i} className="relative group">
                                        {i > 0 && <p className="text-[10px] font-bold text-[#9BA5B4] uppercase mb-1">SKILL {i+1}</p>}
                                        <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_0.8fr_40px] gap-3 items-end">
                                           <MapperSelect label="Skill name" value={s.name} onChange={v => { const n = [...mapping.skills]; n[i].name = v; setMapping({...mapping, skills: n}); }} options={csvHeaders} />
                                           <MapperSelect label="Level" value={s.level} onChange={v => { const n = [...mapping.skills]; n[i].level = v; setMapping({...mapping, skills: n}); }} options={csvHeaders} />
                                           <MapperSelect label="Years experience" value={s.years} onChange={v => { const n = [...mapping.skills]; n[i].years = v; setMapping({...mapping, skills: n}); }} options={csvHeaders} />
                                           {mapping.skills.length > 1 && (
                                              <button onClick={() => removeSkill(i)} className="h-[38px] flex items-center justify-center text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                           )}
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* SECTION 3: EXPERIENCE */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">3. Experience</h3>
                                  <span onClick={addExperience} className="text-[12px] font-medium text-[#2B71F0] hover:underline cursor-pointer font-jakarta">+ ADD BLOCK</span>
                               </div>
                               <div className="space-y-4">
                                  {mapping.experience.map((exp, i) => (
                                     <div key={i} className="bg-[#F8F9FC] border border-[#E8EAED] rounded-lg p-5 relative group">
                                        <div className="flex justify-between items-center mb-3">
                                           <span className="text-[11px] font-bold text-[#9BA5B4] uppercase font-jakarta">ROLE {i+1}</span>
                                           {mapping.experience.length > 1 && <button onClick={() => removeExperience(i)} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>}
                                        </div>
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <MapperSelect label="COMPANY" value={exp.company} onChange={v => { const n = [...mapping.experience]; n[i].company = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} />
                                              <MapperSelect label="JOB TITLE" value={exp.role} onChange={v => { const n = [...mapping.experience]; n[i].role = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} />
                                           </div>
                                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                              <MapperSelect label="START DATE" value={exp.start} onChange={v => { const n = [...mapping.experience]; n[i].start = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} hint="YYYY-MM or MM/YYYY" />
                                              <MapperSelect label="END DATE" value={exp.end} onChange={v => { const n = [...mapping.experience]; n[i].end = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} hint="YYYY-MM or Present" />
                                              <MapperSelect label="TECHNOLOGIES" value={exp.tech} onChange={v => { const n = [...mapping.experience]; n[i].tech = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} />
                                           </div>
                                           <MapperSelect label="DESCRIPTION / ACHIEVEMENT" value={exp.desc} onChange={v => { const n = [...mapping.experience]; n[i].desc = v; setMapping({...mapping, experience: n}); }} options={csvHeaders} />
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* SECTION 4: EDUCATION */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">4. Education</h3>
                                  <span onClick={addEducation} className="text-[12px] font-medium text-[#2B71F0] hover:underline cursor-pointer font-jakarta">+ ADD BLOCK</span>
                               </div>
                               <div className="space-y-4">
                                  {mapping.education.map((ed, i) => (
                                     <div key={i} className="bg-[#F8F9FC] border border-[#E8EAED] rounded-lg p-5 relative group">
                                        <div className="flex justify-between items-center mb-3">
                                           <span className="text-[11px] font-bold text-[#9BA5B4] uppercase font-jakarta">DEGREE {i+1}</span>
                                           {mapping.education.length > 1 && <button onClick={() => removeEducation(i)} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>}
                                        </div>
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <MapperSelect label="INSTITUTION" value={ed.institution} onChange={v => { const n = [...mapping.education]; n[i].institution = v; setMapping({...mapping, education: n}); }} options={csvHeaders} />
                                              <MapperSelect label="DEGREE" value={ed.degree} onChange={v => { const n = [...mapping.education]; n[i].degree = v; setMapping({...mapping, education: n}); }} options={csvHeaders} />
                                           </div>
                                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                              <MapperSelect label="FIELD OF STUDY" value={ed.field} onChange={v => { const n = [...mapping.education]; n[i].field = v; setMapping({...mapping, education: n}); }} options={csvHeaders} />
                                              <MapperSelect label="START YEAR" value={ed.start} onChange={v => { const n = [...mapping.education]; n[i].start = v; setMapping({...mapping, education: n}); }} options={csvHeaders} />
                                              <MapperSelect label="END YEAR" value={ed.end} onChange={v => { const n = [...mapping.education]; n[i].end = v; setMapping({...mapping, education: n}); }} options={csvHeaders} />
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* SECTION 5: PROJECTS */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">5. Projects</h3>
                                  <span onClick={addProject} className="text-[12px] font-medium text-[#2B71F0] hover:underline cursor-pointer font-jakarta">+ ADD BLOCK</span>
                               </div>
                               <div className="space-y-4">
                                  {mapping.projects.map((proj, i) => (
                                     <div key={i} className="bg-[#F8F9FC] border border-[#E8EAED] rounded-lg p-5 relative group">
                                        <div className="flex justify-between items-center mb-3">
                                           <span className="text-[11px] font-bold text-[#9BA5B4] uppercase font-jakarta">PROJECT {i+1}</span>
                                           {mapping.projects.length > 1 && <button onClick={() => removeProject(i)} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>}
                                        </div>
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <MapperSelect label="PROJECT NAME" value={proj.name} onChange={v => { const n = [...mapping.projects]; n[i].name = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                              <MapperSelect label="ROLE IN PROJECT" value={proj.role} onChange={v => { const n = [...mapping.projects]; n[i].role = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                           </div>
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <MapperSelect label="TECHNOLOGIES" value={proj.tech} onChange={v => { const n = [...mapping.projects]; n[i].tech = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                              <MapperSelect label="DESCRIPTION" value={proj.desc} onChange={v => { const n = [...mapping.projects]; n[i].desc = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                           </div>
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <MapperSelect label="START DATE" value={proj.start} onChange={v => { const n = [...mapping.projects]; n[i].start = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                              <MapperSelect label="END DATE" value={proj.end} onChange={v => { const n = [...mapping.projects]; n[i].end = v; setMapping({...mapping, projects: n}); }} options={csvHeaders} />
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* SECTION 6: AVAILABILITY */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">6. Availability</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                                  <MapperSelect 
                                    label="STATUS" 
                                    value={mapping.availabilityStatus} 
                                    onChange={v => setMapping({...mapping, availabilityStatus: v})} 
                                    options={csvHeaders} 
                                    hint='Maps: "available" → Available, "open" → Open to Opportunities' 
                                  />
                                  <MapperSelect 
                                    label="TYPE" 
                                    value={mapping.availabilityType} 
                                    onChange={v => setMapping({...mapping, availabilityType: v})} 
                                    options={csvHeaders} 
                                    hint='Maps: "full time" → Full-time, "part time" → Part-time' 
                                  />
                               </div>
                            </div>

                            {/* SECTION 7: SOCIAL LINKS */}
                            <div>
                               <div className="flex items-center justify-between border-b border-[#E8EAED] pb-2 mb-4">
                                  <h3 className="text-[12px] font-bold text-[#9BA5B4] uppercase tracking-[0.06em] font-jakarta">7. Social Links</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <MapperSelect label="LINKEDIN" value={mapping.linkedin} onChange={v => setMapping({...mapping, linkedin: v})} options={csvHeaders} />
                                  <MapperSelect label="GITHUB" value={mapping.github} onChange={v => setMapping({...mapping, github: v})} options={csvHeaders} />
                                  <MapperSelect label="PORTFOLIO" value={mapping.portfolio} onChange={v => setMapping({...mapping, portfolio: v})} options={csvHeaders} />
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* TAB 3: BULK PDF UPLOAD */}
          {tab === "bulk-pdf" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-300">
               <div 
                 onClick={() => document.getElementById("multi-pdf-input")?.click()}
                 className="min-h-[200px] bg-[#F8F9FC] border-2 border-dashed border-[#E8EAED] rounded-lg flex flex-col items-center justify-center p-10 cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all group"
               >
                  <input id="multi-pdf-input" type="file" accept=".pdf" multiple className="hidden" onChange={e => {
                     const files = Array.from(e.target.files || []);
                     setSelectedPdfs(prev => [...prev, ...files].slice(0, 50));
                  }} />
                  <svg className="h-[36px] w-[36px] text-[#9BA5B4] mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <div className="text-[16px] font-semibold text-[#0F1621] font-jakarta">Upload multiple PDF resumes</div>
                  <p className="text-[14px] text-[#9BA5B4] mt-1 font-jakarta">Drag and drop PDF files here, or click to browse</p>
                  <p className="text-[12px] text-[#9BA5B4] mt-3 font-jakarta">Maximum 50 files per upload · 10MB per file</p>
               </div>

               {selectedPdfs.length > 0 && (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[14px] font-semibold text-[#0F1621] font-jakarta">{selectedPdfs.length} files selected</h3>
                       <button onClick={() => setSelectedPdfs([])} className="text-[12px] text-[#DC2626] font-medium hover:underline font-jakarta">Remove all</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {selectedPdfs.map((file, i) => (
                         <div key={i} className="bg-white border border-[#E8EAED] rounded-lg p-3 flex items-center gap-3 mb-2 shadow-sm animate-in slide-in-from-right-2" style={{ animationDelay: `${i*30}ms` }}>
                            <svg className="h-[18px] w-[18px] text-[#DC2626] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                            <div className="text-[13px] font-medium text-[#0F1621] truncate flex-1 font-jakarta">{file.name}</div>
                            <div className="text-[12px] text-[#9BA5B4] whitespace-nowrap font-jakarta">{(file.size / 1024).toFixed(1)} KB</div>
                            <button onClick={() => setSelectedPdfs(prev => prev.filter((_, idx) => idx !== i))} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors p-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                         </div>
                       ))}
                    </div>

                    <div className="bg-[#EEF4FF] border border-[#BBCFFF] rounded-lg p-4 space-y-3 shadow-sm">
                       <h4 className="text-[14px] font-semibold text-[#0F1621] font-jakarta">How we match PDFs to candidates</h4>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[12px] text-[#5A6474] font-jakarta">
                             <span>📄</span> <strong>firstname_lastname.pdf</strong> → matched by name
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-[#5A6474] font-jakarta">
                             <span>📧</span> <strong>email@address.com.pdf</strong> → matched by email
                          </div>
                       </div>
                    </div>

                    {bulkPdfLoading && (
                       <div className="space-y-2 pt-2">
                          <div className="text-[13px] font-semibold text-[#2B71F0] font-jakarta">Parsing resumes...</div>
                          <div className="h-1 bg-[#E8EAED] rounded-full overflow-hidden">
                             <div className="h-full bg-[#2B71F0] transition-all duration-500" style={{ width: `${bulkPdfProgress}%` }} />
                          </div>
                       </div>
                    )}

                    <button 
                      onClick={submitBulkPdfs}
                      disabled={bulkPdfLoading || selectedPdfs.length === 0}
                      className="w-full bg-[#2B71F0] text-white py-4 rounded-xl font-bold text-[15px] shadow-sm hover:bg-[#1A5CE0] transition-all active:scale-[0.99] disabled:opacity-50 font-jakarta"
                    >
                       {bulkPdfLoading ? `Processing...` : `Upload and parse ${selectedPdfs.length} PDFs`}
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* MANUAL ENRICHMENT */}
      <div className="bg-white border border-[#E8EAED] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
         <div className="space-y-1">
            <h2 className="text-[18px] font-bold text-[#0F1621] font-jakarta">Manual Enrichment</h2>
            <p className="text-[14px] text-[#5A6474] font-jakarta">Attach a PDF resume to enrich a specific candidate's AI scoring.</p>
         </div>
         <div className="h-[1px] bg-[#E8EAED]" />
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[13px] font-medium text-[#5A6474] font-jakarta">Target Candidate</label>
               <select 
                 value={selectedApplicantId} 
                 onChange={e => setSelectedApplicantId(e.target.value)} 
                 className="w-full bg-white border-[1.5px] border-[#E8EAED] rounded-lg px-4 py-2.5 text-[14px] text-[#0F1621] font-jakarta outline-none focus:border-[#2B71F0] transition-all"
               >
                  <option value="">Choose an applicant...</option>
                  {(applicantsState ?? []).map((a: any) => <option key={a.id} value={a.id}>{getDisplayName(a)}</option>)}
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[13px] font-medium text-[#5A6474] font-jakarta">PDF Document</label>
               <div 
                 onClick={() => document.getElementById("manual-pdf-input")?.click()}
                 className="w-full bg-white border-[1.5px] border-[#E8EAED] rounded-lg px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-[#2B71F0] transition-colors"
               >
                  <input id="manual-pdf-input" type="file" accept=".pdf" className="hidden" onChange={e => setManualPdf(e.target.files?.[0] || null)} />
                  <svg className="h-5 w-5 text-[#9BA5B4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className={classNames("text-[14px] font-jakarta", manualPdf ? "text-[#0F1621] font-medium" : "text-[#9BA5B4]")}>
                     {manualPdf ? manualPdf.name : "Choose PDF file"}
                  </span>
               </div>
            </div>
         </div>

         <div className="pt-2 flex flex-col gap-4">
            {uploadStatus && (
               <div className={classNames("text-[13px] font-medium font-jakarta", uploadStatus.includes("Success") ? "text-[#10B981]" : "text-[#DC2626]")}>
                  {uploadStatus}
               </div>
            )}
            <button 
              onClick={submitManualResume} 
              disabled={!manualPdf || !selectedApplicantId}
              className="bg-[#2B71F0] text-white px-8 py-2.5 rounded-lg font-semibold text-[14px] shadow-sm hover:bg-[#1A5CE0] transition-all active:scale-[0.98] disabled:opacity-50 w-fit font-jakarta"
            >
               Attach Resume
            </button>
         </div>
      </div>
    </div>
  );
}
