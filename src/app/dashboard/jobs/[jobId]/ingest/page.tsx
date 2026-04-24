"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  thunkFetchApplicants,
  thunkIngestCsv,
  thunkIngestUmuravaProfiles,
  thunkIngestZip,
  thunkUploadResume
} from "@/store/slices/dashboardSlice";

type TabKey = "umurava" | "external" | "zip";
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
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
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
  projects: {
    name: string;
    description: string;
    technologies: string[];
    role: string;
    "Start Date": string;
    "End Date": string;
  }[];
  availability: {
    status: string;
    type: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

interface DetailedMapping {
  fullName: string;
  email: string;
  headline: string;
  location: string;
  bio: string;
  resumeUrl: string;
  skills: { name: string; level: string; years: string }[];
  experience: { company: string; role: string; start: string; end: string; description: string; technologies: string }[];
  education: { institution: string; degree: string; field: string; start: string; end: string }[];
  projects: { name: string; description: string; technologies: string; role: string; start: string; end: string }[];
  availabilityStatus: string;
  employmentType: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

function getDisplayName(c: any) {
  if (!c) return "Unknown Candidate";
  const { firstName, lastName, name, fullName, email, id, applicantId } = c;
  
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return (
    firstName ||
    lastName ||
    name ||
    fullName ||
    email ||
    `Candidate ${(id || applicantId)?.slice(-4) || "????"}`
  );
}

function normalizeAvailabilityStatus(s?: string): "Available" | "Open to Opportunities" | "Not Available" {
  const val = (s || "").toLowerCase();
  if (val.includes("open")) return "Open to Opportunities";
  if (val.includes("not") || val.includes("unavailable")) return "Not Available";
  return "Available";
}

function normalizeEmploymentType(s?: string): "Full-time" | "Part-time" | "Contract" {
  const val = (s || "").toLowerCase();
  if (val.includes("part")) return "Part-time";
  if (val.includes("contract")) return "Contract";
  return "Full-time";
}

function parseCsvContent(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function safeJsonParse(json: string) {
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export default function IngestPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const applicantsState = useAppSelector((s) => s.dashboard.applicants);

  const [tab, setTab] = useState<TabKey>("umurava");
  const [umuravaMode, setUmuravaInputMode] = useState<UmuravaInputMode>("paste");
  
  // --- Umurava State ---
  const [profilesJson, setProfilesJson] = useState("");
  const [validatedProfiles, setValidatedProfiles] = useState<UmuravaProfile[]>([]);
  const [umuravaErrors, setUmuravaErrors] = useState<string[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [ingestResultA, setIngestResultA] = useState<any | null>(null);
  const [ingestErrorA, setIngestErrorA] = useState<string | null>(null);

  // --- External CSV State ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvFormat, setCsvFormat] = useState<"simple" | "detailed">("detailed");
  const [detailedMapping, setDetailedMapping] = useState<DetailedMapping>({
    fullName: "", email: "", headline: "", location: "", bio: "",
    resumeUrl: "",
    skills: [{ name: "", level: "", years: "" }],
    experience: [{ company: "", role: "", start: "", end: "", description: "", technologies: "" }],
    education: [{ institution: "", degree: "", field: "", start: "", end: "" }],
    projects: [{ name: "", description: "", technologies: "", role: "", start: "", end: "" }],
    availabilityStatus: "",
    employmentType: "",
    linkedin: "",
    github: "",
    portfolio: ""
  });
  const [ingestResultB, setIngestResultB] = useState<any | null>(null);
  const [ingestErrorB, setIngestErrorB] = useState<string | null>(null);
  const [loadingB, setLoadingB] = useState(false);
  const [isCsvIngested, setIsCsvIngested] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // --- ZIP Ingestion State ---
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipIngestResult, setZipIngestResult] = useState<any | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [showNamingGuide, setShowNamingGuide] = useState(false);

  const isProcessing = useMemo(() => {
    return (applicantsState ?? []).some(
      (a: any) => a.ingestionStatus === "processing" || a.ingestionStatus === "queued" || a.ingestionStatus === "pending"
    );
  }, [applicantsState]);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchApplicants(jobId) as any);
  }, [jobId, dispatch]);

  useEffect(() => {
    if (!jobId || !isProcessing) return;
    const interval = setInterval(() => {
      void dispatch(thunkFetchApplicants(jobId) as any);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, isProcessing, dispatch]);

  useEffect(() => {
    if (tab !== "umurava" || umuravaMode !== "paste") return;
    const timer = setTimeout(() => {
      handleValidateProfiles(profilesJson);
    }, 300);
    return () => clearTimeout(timer);
  }, [profilesJson, tab, umuravaMode]);

  function handleValidateProfiles(jsonString: string) {
    if (!jsonString.trim()) {
      setUmuravaErrors([]);
      setValidatedProfiles([]);
      return;
    }
    const parsed = safeJsonParse(jsonString);
    if (!parsed.ok) {
      setUmuravaErrors([parsed.error]);
      setValidatedProfiles([]);
      return;
    }
    const data = parsed.value;
    if (!Array.isArray(data)) {
      setUmuravaErrors(["JSON must be an array of profiles"]);
      setValidatedProfiles([]);
      return;
    }
    const errs: string[] = [];
    const valid: UmuravaProfile[] = [];
    data.forEach((p, i) => {
      const missing = [];
      if (!p.firstName) missing.push("firstName");
      if (!p.lastName) missing.push("lastName");
      if (!p.email) missing.push("email");
      if (!p.skills?.length) missing.push("skills (min 1)");
      if (!p.experience?.length) missing.push("experience (min 1)");
      if (!p.education?.length) missing.push("education (min 1)");
      if (!p.projects?.length) missing.push("projects (min 1)");
      if (missing.length) {
        errs.push(`Profile ${i + 1} (${p.email || "no email"}): missing ${missing.join(", ")}`);
      } else {
        valid.push(p);
      }
    });
    setUmuravaErrors(errs);
    setValidatedProfiles(valid);
  }

  async function onJsonFileSelected(file: File) {
    const text = await file.text();
    setProfilesJson(text);
    handleValidateProfiles(text);
  }

  async function submitUmuravaProfiles() {
    if (!jobId || !validatedProfiles.length) return;
    setLoadingA(true);
    setIngestErrorA(null);
    try {
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles: validatedProfiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setIngestResultA(resAction.payload.data ?? resAction.payload);
        setProfilesJson("");
        setValidatedProfiles([]);
        void dispatch(thunkFetchApplicants(jobId) as any);
      } else {
        throw new Error(resAction.error.message || "Ingestion failed");
      }
    } catch (err: any) {
      setIngestErrorA(err.message);
    } finally {
      setLoadingA(false);
    }
  }

  async function onCsvSelected(file: File) {
    setCsvFile(file);
    const text = await file.text();
    const rows = parseCsvContent(text);
    setCsvRows(rows);
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      setCsvHeaders(headers);
      setDetailedMapping(prev => {
        const next = { ...prev };
        const findMatch = (keys: string[]) => headers.find(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
        next.fullName = findMatch(["name", "full name"]) || "";
        next.email = findMatch(["email"]) || "";
        next.headline = findMatch(["headline", "title"]) || "";
        next.location = findMatch(["location", "city"]) || "";
        next.resumeUrl = findMatch(["resume", "link", "cv", "url"]) || "";
        return next;
      });
    }
  }

  function transformDetailedRow(row: Record<string, string>, mapping: DetailedMapping): UmuravaProfile {
    const nameParts = row[mapping.fullName]?.split(" ") || [];
    const skills = mapping.skills.map(s => ({
      name: row[s.name] || "",
      level: (row[s.level] || "Intermediate") as any,
      yearsOfExperience: Number(row[s.years] || 0)
    })).filter(s => s.name);

    const experience = mapping.experience.map(e => ({
      company: row[e.company] || "",
      role: row[e.role] || "",
      "Start Date": row[e.start] || "",
      "End Date": row[e.end] || "Present",
      description: row[e.description] || "",
      technologies: (row[e.technologies] || "").split(",").map(t => t.trim()).filter(Boolean),
      "Is Current": !row[e.end] || row[e.end].toLowerCase() === "present"
    })).filter(e => e.company);

    const education = mapping.education.map(ed => ({
      institution: row[ed.institution] || "",
      degree: row[ed.degree] || "",
      "Field of Study": row[ed.field] || "",
      "Start Year": Number(row[ed.start] || 0),
      "End Year": Number(row[ed.end] || 0)
    })).filter(ed => ed.institution);

    const projects = mapping.projects.map(p => ({
      name: row[p.name] || "",
      description: row[p.description] || "",
      technologies: (row[p.technologies] || "").split(",").map(t => t.trim()).filter(Boolean),
      role: row[p.role] || "",
      "Start Date": row[p.start] || "",
      "End Date": row[p.end] || ""
    })).filter(p => p.name);

    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: row[mapping.email] || "",
      headline: row[mapping.headline] || "",
      location: row[mapping.location] || "",
      bio: row[mapping.bio] || undefined,
      resumeUrl: row[mapping.resumeUrl] || undefined,
      skills: skills.length > 0 ? skills : [{ name: "Not specified", level: "Intermediate", yearsOfExperience: 0 }],
      experience: experience.length > 0 ? experience : [{
        company: "Not specified",
        role: "Not specified",
        "Start Date": "2020-01",
        "End Date": "Present",
        description: "",
        technologies: [],
        "Is Current": true
      }],
      education: education.length > 0 ? education : [{
        institution: "Not specified",
        degree: "Bachelor's",
        "Field of Study": "Not specified",
        "Start Year": 2018,
        "End Year": 2022
      }],
      projects,
      availability: {
        status: normalizeAvailabilityStatus(row[mapping.availabilityStatus]),
        type: normalizeEmploymentType(row[mapping.employmentType])
      },
      socialLinks: {
        linkedin: row[mapping.linkedin],
        github: row[mapping.github],
        portfolio: row[mapping.portfolio]
      }
    };
  }

  async function submitCsvIngestion() {
    if (!jobId || !csvFile) return;
    setLoadingB(true);
    setIngestErrorB(null);
    try {
      const profiles = csvRows.map(row => transformDetailedRow(row, detailedMapping));
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setIngestResultB(resAction.payload.data ?? resAction.payload);
        setIsCsvIngested(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
      } else {
        throw new Error(resAction.error.message || "CSV ingestion failed");
      }
    } catch (err: any) {
      setIngestErrorB(err.message);
    } finally {
      setLoadingB(false);
    }
  }

  async function submitResumeUpload() {
    if (!jobId || !pdfFile || !selectedApplicantId) return;
    setUploadStatus("Uploading...");
    try {
      const resAction = await dispatch(thunkUploadResume({ jobId, applicantId: selectedApplicantId, pdfFile }) as any);
      if (thunkUploadResume.fulfilled.match(resAction)) {
        setUploadStatus("Resume stored. AI extraction starting...");
        setPdfFile(null);
        setSelectedApplicantId("");
        void dispatch(thunkFetchApplicants(jobId) as any);
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        throw new Error(resAction.error.message || "Upload failed");
      }
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
    }
  }

  async function onZipSelected(file: File) {
    setZipFile(file);
    setZipIngestResult(null);
    setZipError(null);
  }

  async function submitZipIngestion() {
    if (!jobId || !zipFile) return;
    setZipLoading(true);
    setZipError(null);
    try {
      const resAction = await dispatch(thunkIngestZip({ jobId, zipFile }) as any);
      if (thunkIngestZip.fulfilled.match(resAction)) {
        setZipIngestResult(resAction.payload.data ?? resAction.payload);
        void dispatch(thunkFetchApplicants(jobId) as any);
      } else {
        throw new Error(resAction.error.message || "ZIP ingestion failed");
      }
    } catch (err: any) {
      setZipError(err.message);
    } finally {
      setZipLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F1621]">Ingest Candidates</h1>
          <p className="text-sm text-[#5A6474]">Add talent to this campaign using multiple scalable formats.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
          className="bg-[#2B71F0] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-[#1A5CE0] transition-all"
        >
          View Shortlist
        </button>
      </div>

      {isProcessing && (
        <div className="bg-[#EEF4FF] border border-[#2B71F0]/20 rounded-xl p-4 flex items-center justify-between animate-pulse shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#2B71F0] shadow-sm">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F1621]">Processing candidates...</div>
              <p className="text-xs text-[#5A6474]">AI is parsing resumes and fetching data in the background.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-[#2B71F0] text-[11px] font-bold uppercase tracking-wider border border-[#EEF4FF]">
            {(applicantsState ?? []).filter((a: any) => ["processing", "queued", "pending"].includes(a.ingestionStatus)).length} pending
          </span>
        </div>
      )}

      {(applicantsState ?? []).some((a: any) => (a.errors ?? []).length > 0) && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Ingestion Issues ({(applicantsState ?? []).filter((a: any) => (a.errors ?? []).length > 0).length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(applicantsState ?? []).filter((a: any) => (a.errors ?? []).length > 0).map((a: any) => (
              <div key={a.id} className="bg-white rounded-lg border border-red-100 p-3 flex items-start justify-between gap-4 shadow-sm">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#0F1621] truncate">{getDisplayName(a)}</div>
                  <div className="text-[11px] text-red-500 font-medium mt-0.5">{a.errors[0]?.message || "Failed to fetch resume"}</div>
                </div>
                <button
                  onClick={() => { setSelectedApplicantId(a.id); setTab("external"); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
                  className="text-[10px] font-bold text-[#2B71F0] uppercase hover:underline shrink-0"
                >
                  Manual fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-[#E8EAED] rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E8EAED] px-2 bg-[#F8F9FC]">
          {[
            { id: "umurava", label: "Umurava Profiles" },
            { id: "zip", label: "Bulk Archive (ZIP)" },
            { id: "external", label: "External (CSV)" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabKey)}
              className={`
                px-6 py-4 text-sm transition-all relative border-b-2
                ${tab === t.id 
                  ? "text-[#2B71F0] border-[#2B71F0] font-semibold" 
                  : "text-[#5A6474] border-transparent font-medium hover:text-[#0F1621]"}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {tab === "umurava" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-300">
               {/* Mode Switcher */}
               <div className="flex bg-[#F5F6FA] p-1 rounded-lg w-fit">
                  <button onClick={() => setUmuravaInputMode("paste")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${umuravaMode === "paste" ? "bg-white text-[#2B71F0] shadow-sm" : "text-[#5A6474] hover:text-[#0F1621]"}`}>JSON Paste</button>
                  <button onClick={() => setUmuravaInputMode("upload")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${umuravaMode === "upload" ? "bg-white text-[#2B71F0] shadow-sm" : "text-[#5A6474] hover:text-[#0F1621]"}`}>File Upload</button>
               </div>

               {umuravaMode === "paste" ? (
                 <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#5A6474] uppercase tracking-wider">Paste candidate profiles (JSON array)</label>
                    <textarea
                      value={profilesJson}
                      onChange={(e) => setProfilesJson(e.target.value)}
                      placeholder={`[\n  {\n    "firstName": "Amara",\n    "lastName": "Diallo",\n    "email": "amara@example.com",\n    ...\n  }\n]`}
                      className={`w-full min-h-[220px] rounded-lg border bg-[#F8FAFC] p-4 text-[13px] font-mono focus:ring-2 focus:ring-[#2B71F0]/20 focus:border-[#2B71F0] transition-all outline-none ${profilesJson && umuravaErrors.length > 0 ? "border-red-300" : profilesJson && validatedProfiles.length > 0 ? "border-[#10B981]" : "border-[#E8EAED]"}`}
                    />
                 </div>
               ) : (
                 <div
                   onClick={() => document.getElementById("json-input")?.click()}
                   className="rounded-xl border-2 border-dashed border-[#E8EAED] bg-[#F8F9FC] p-16 text-center cursor-pointer hover:border-[#2B71F0] hover:bg-[#EEF4FF] transition-all"
                 >
                    <input id="json-input" className="hidden" type="file" accept=".json" onChange={e => e.target.files?.[0] && onJsonFileSelected(e.target.files[0])} />
                    <svg className="mx-auto h-10 w-10 text-[#9BA5B4] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <div className="text-sm font-bold text-[#0F1621]">Drop your .json file here</div>
                    <p className="text-xs text-[#5A6474] mt-1">Official Umurava schema validation active</p>
                 </div>
               )}

               {/* Errors / Success Feedback */}
               {umuravaErrors.length > 0 && (
                 <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs space-y-1">
                    <p className="font-bold uppercase tracking-widest mb-2">Validation Errors</p>
                    {umuravaErrors.slice(0, 5).map((err, i) => <p key={i}>&bull; {err}</p>)}
                    {umuravaErrors.length > 5 && <p>...and {umuravaErrors.length - 5} more</p>}
                 </div>
               )}

               {validatedProfiles.length > 0 && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                       {validatedProfiles.length} profiles ready to ingest
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {validatedProfiles.slice(0, 4).map((p, idx) => (
                         <div key={idx} className="bg-white border border-[#E8EAED] rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                               <div className="min-w-0 flex-1">
                                  <div className="font-bold text-[#0F1621] truncate">{p.firstName} {p.lastName}</div>
                                  <div className="text-[12px] text-[#5A6474] truncate mt-0.5">{p.headline}</div>
                               </div>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.availability.status === "Available" ? "bg-[#F0FDF4] text-[#059669] border-[#10B981]" : "bg-[#F5F6FA] text-[#5A6474] border-[#E8EAED]"}`}>{p.availability.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                               {p.skills.slice(0, 3).map((s, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2B71F0] text-[10px] font-bold">{s.name}</span>)}
                            </div>
                         </div>
                       ))}
                    </div>
                    <button onClick={submitUmuravaProfiles} disabled={loadingA} className="w-full bg-[#2B71F0] hover:bg-[#1A5CE0] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50">
                      {loadingA ? "Ingesting..." : `Ingest ${validatedProfiles.length} profiles`}
                    </button>
                 </div>
               )}
            </div>
          ) : tab === "zip" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-300">
               <div
                 onClick={() => document.getElementById("zip-input")?.click()}
                 className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-all ${zipFile ? "border-[#10B981] bg-[#F0FDF4]" : "border-[#E8EAED] bg-[#F8F9FC] hover:border-[#2B71F0] hover:bg-[#EEF4FF]"}`}
               >
                  <input id="zip-input" className="hidden" type="file" accept=".zip" onChange={e => e.target.files?.[0] && onZipSelected(e.target.files[0])} />
                  <svg className="mx-auto h-10 w-10 text-[#9BA5B4] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  <div className="text-sm font-bold text-[#0F1621]">{zipFile ? `Selected: ${zipFile.name}` : "Drop your .zip archive here"}</div>
                  <p className="text-xs text-[#5A6474] mt-1">Files should be named by candidate name or email</p>
               </div>
               
               <button onClick={submitZipIngestion} disabled={zipLoading || !zipFile} className="w-full bg-[#2B71F0] hover:bg-[#1A5CE0] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50">
                  {zipLoading ? "Extracting..." : "Ingest ZIP Archive"}
               </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-300">
               <div
                 onClick={() => document.getElementById("csv-input")?.click()}
                 className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-all ${csvFile ? "border-[#10B981] bg-[#F0FDF4]" : "border-[#E8EAED] bg-[#F8F9FC] hover:border-[#2B71F0] hover:bg-[#EEF4FF]"}`}
               >
                  <input id="csv-input" className="hidden" type="file" accept=".csv" onChange={e => e.target.files?.[0] && onCsvSelected(e.target.files[0])} />
                  <svg className="mx-auto h-10 w-10 text-[#9BA5B4] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <div className="text-sm font-bold text-[#0F1621]">{csvFile ? `Selected: ${csvFile.name}` : "Drop your .csv file here"}</div>
                  <p className="text-xs text-[#5A6474] mt-1">{csvRows.length > 0 ? `${csvRows.length} rows detected` : "Ensure headers match standard mapping"}</p>
               </div>

               {csvRows.length > 0 && (
                 <button onClick={submitCsvIngestion} disabled={loadingB} className="w-full bg-[#2B71F0] hover:bg-[#1A5CE0] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50">
                    {loadingB ? "Processing..." : `Ingest ${csvRows.length} rows`}
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
