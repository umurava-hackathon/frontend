"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  thunkFetchApplicants,
  thunkIngestCsv,
  thunkIngestUmuravaProfiles,
  thunkUploadResume
} from "@/store/slices/dashboardSlice";
import { apiGetParseStatus, apiIngestCsv } from "@/lib/api";

type TabKey = "umurava" | "external";
type UmuravaInputMode = "paste" | "upload";
type CsvFormat = "simple" | "detailed";

interface UmuravaProfile {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  _resumeUrl?: string; // Internal field for ingestion
  skills: {
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    yearsOfExperience: number;
  }[];
  languages?: {
    name: string;
    proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
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
  certifications?: {
    name: string;
    issuer: string;
    "Issue Date": string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    role: string;
    link?: string;
    "Start Date": string;
    "End Date": string;
  }[];
  availability: {
    status: "Available" | "Open to Opportunities" | "Not Available";
    type: "Full-time" | "Part-time" | "Contract";
    "Start Date"?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

const SIMPLE_MAPPING_FIELDS = [
  { section: "BASIC INFO", fields: [
    { key: "fullName", label: "Full name" },
    { key: "email", label: "Email" },
    { key: "headline", label: "Headline" },
    { key: "location", label: "Location" },
    { key: "resumeUrl", label: "Resume URL" },
    { key: "bio", label: "Bio (optional)" }
  ]},
  { section: "SKILLS (accept comma-separated string)", fields: [
    { key: "skillsList", label: "Skills list" },
    { key: "skillLevels", label: "Skill levels (optional)" },
    { key: "skillYears", label: "Years of experience (optional)" }
  ]},
  { section: "EXPERIENCE", fields: [
    { key: "currentCompany", label: "Current company" },
    { key: "currentRole", label: "Current role" },
    { key: "yearsExperience", label: "Years experience" },
    { key: "experienceSummary", label: "Experience summary" },
    { key: "technologies", label: "Technologies used" }
  ]},
  { section: "EDUCATION", fields: [
    { key: "institution", label: "Institution" },
    { key: "degree", label: "Degree" },
    { key: "fieldOfStudy", label: "Field of study" }
  ]},
  { section: "AVAILABILITY", fields: [
    { key: "availabilityStatus", label: "Availability status" },
    { key: "employmentType", label: "Employment type" }
  ]}
] as const;

type SimpleMappingKey = (typeof SIMPLE_MAPPING_FIELDS)[number]["fields"][number]["key"];

type SimpleMapping = Record<SimpleMappingKey, string>;

interface DetailedMapping {
  fullName: string;
  email: string;
  headline: string;
  location: string;
  resumeUrl: string;
  bio: string;
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

function parseCommaSeparated(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((v) => v.trim()).filter(Boolean);
}

function getStartDateFromYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeAvailabilityStatus(s?: string): "Available" | "Open to Opportunities" | "Not Available" {
  const val = (s || "").toLowerCase();
  if (val.includes("not")) return "Not Available";
  if (val.includes("open")) return "Open to Opportunities";
  if (val.includes("available")) return "Available";
  return "Available";
}

function normalizeEmploymentType(s?: string): "Full-time" | "Part-time" | "Contract" {
  const val = (s || "").toLowerCase();
  if (val.includes("part")) return "Part-time";
  if (val.includes("contract")) return "Contract";
  return "Full-time";
}

function parseCsvContent(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  
  // Simple CSV parser that handles basic commas
  // Note: Doesn't handle escaped commas in quotes perfectly, but sufficient for this scope
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

function safeJsonParse(s: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON — check your formatting" };
  }
}

function parseCsvHeader(csvText: string): string[] {
  const firstLine = csvText.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return [];
  return firstLine.split(",").map((h) => h.trim()).filter(Boolean);
}

function validateUmuravaProfile(p: any, index: number): { profile?: UmuravaProfile; error?: string } {
  const required = [
    "firstName", "lastName", "email", "headline", "location",
    "skills", "experience", "education", "projects", "availability"
  ];
  
  for (const field of required) {
    if (p[field] === undefined || p[field] === null || p[field] === "") {
      return { error: `Profile ${index + 1} (${p.email || 'unknown'}): missing or empty '${field}'` };
    }
  }

  if (!Array.isArray(p.skills) || p.skills.length === 0) return { error: `Profile ${index + 1}: 'skills' must be a non-empty array` };
  if (!Array.isArray(p.experience) || p.experience.length === 0) return { error: `Profile ${index + 1}: 'experience' must be a non-empty array` };
  if (!Array.isArray(p.education) || p.education.length === 0) return { error: `Profile ${index + 1}: 'education' must be a non-empty array` };
  
  if (!p.availability || !p.availability.status || !p.availability.type) return { error: `Profile ${index + 1}: 'availability' must have status and type` };

  // Nested validation for essential preview fields
  for (const s of p.skills) {
    if (!s.name) return { error: `Profile ${index + 1}: skill is missing 'name'` };
  }

  return { profile: p as UmuravaProfile };
}

export default function IngestPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const applicantsState = useAppSelector((s) => s.dashboard.applicants);
  const [tab, setTab] = useState<TabKey>("umurava");

  // --- Umurava Profiles State ---
  const [umuravaMode, setUmuravaInputMode] = useState<UmuravaInputMode>("paste");
  const [profilesJson, setProfilesJson] = useState<string>("");
  const [validatedProfiles, setValidatedProfiles] = useState<UmuravaProfile[]>([]);
  const [umuravaErrors, setUmuravaErrors] = useState<string[]>([]);
  const [ingestResultA, setIngestResultA] = useState<any | null>(null);
  const [ingestErrorA, setIngestErrorA] = useState<string | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [isIngested, setIsIngested] = useState(false);

  // --- External CSV + Parsing State ---
  const [parseStatus, setParseStatus] = useState<{ total: number; resumeParsed: number; csvOnly: number; parseErrors: number; processing: boolean } | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPolling && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await apiGetParseStatus(jobId);
          setParseStatus(res.data);
          if (!res.data.processing) {
            setIsPolling(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, jobId]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvFormat, setCsvFormat] = useState<CsvFormat>("simple");
  
  const [simpleMapping, setSimpleMapping] = useState<SimpleMapping>({
    fullName: "", email: "", headline: "", location: "", resumeUrl: "", bio: "",
    skillsList: "", skillLevels: "", skillYears: "",
    currentCompany: "", currentRole: "", yearsExperience: "", experienceSummary: "", technologies: "",
    institution: "", degree: "", fieldOfStudy: "",
    availabilityStatus: "", employmentType: ""
  });

  const [detailedMapping, setDetailedMapping] = useState<DetailedMapping>({
    fullName: "", email: "", headline: "", location: "", resumeUrl: "", bio: "",
    skills: [{ name: "", level: "", years: "" }],
    experience: [{ company: "", role: "", start: "", end: "", description: "", technologies: "" }],
    education: [{ institution: "", degree: "", field: "", start: "", end: "" }],
    projects: [{ name: "", description: "", technologies: "", role: "", start: "", end: "" }],
    availabilityStatus: "", employmentType: "",
    linkedin: "", github: "", portfolio: ""
  });

  const [validatedCsvProfiles, setValidatedCsvProfiles] = useState<UmuravaProfile[]>([]);
  const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([]);

  const [ingestResultB, setIngestResultB] = useState<any | null>(null);
  const [ingestErrorB, setIngestErrorB] = useState<string | null>(null);
  const [loadingB, setLoadingB] = useState(false);
  const [isCsvIngested, setIsCsvIngested] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchApplicants(jobId) as any);
  }, [jobId, dispatch]);

  useEffect(() => {
    if (!jobId) return;
    if (Array.isArray(applicantsState) && applicantsState.length > 0 && !selectedApplicantId) {
      const first = applicantsState.find((a: any) => a.ingestionStatus === "ready") ?? applicantsState[0];
      if (first?.id) setSelectedApplicantId(first.id);
    }
  }, [applicantsState, selectedApplicantId, jobId]);

  // --- Umurava Ingestion Logic ---
  function handleValidateProfiles(jsonString: string) {
    setIngestResultA(null);
    setIngestErrorA(null);
    setIsIngested(false);
    
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
      setUmuravaErrors(["Invalid format: input must be a JSON array of profiles"]);
      setValidatedProfiles([]);
      return;
    }

    const profiles: UmuravaProfile[] = [];
    const errors: string[] = [];

    data.forEach((item, idx) => {
      const { profile, error } = validateUmuravaProfile(item, idx);
      if (error) errors.push(error);
      if (profile) profiles.push(profile);
    });

    setUmuravaErrors(errors);
    setValidatedProfiles(errors.length === 0 ? profiles : []);
  }

  async function onJsonFileSelected(file: File) {
    const text = await file.text();
    setProfilesJson(text); // Sync textarea for convenience
    handleValidateProfiles(text);
  }

  async function submitUmuravaProfiles() {
    if (!jobId || validatedProfiles.length === 0) return;
    setLoadingA(true);
    setIngestErrorA(null);
    try {
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles: validatedProfiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setIngestResultA(resAction.payload.data ?? resAction.payload);
        setIsIngested(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
      } else {
        throw new Error(resAction.error.message || "Ingestion failed");
      }
    } catch (err: any) {
      setIngestErrorA(err?.message ?? "Ingestion failed");
    } finally {
      setLoadingA(false);
    }
  }

  // --- External Ingestion Logic ---
  async function onCsvSelected(file: File) {
    setCsvFile(file);
    setIngestResultB(null);
    setIngestErrorB(null);
    setValidatedCsvProfiles([]);
    setCsvValidationErrors([]);
    setIsCsvIngested(false);
    
    const text = await file.text();
    const headers = parseCsvHeader(text);
    setCsvHeaders(headers);

    if (headers.length > 0) {
      // Auto-detect for Simple Mapping
      setSimpleMapping((prev) => {
        const next = { ...prev };
        const findMatch = (hList: string[]) => headers.find(h => hList.some(cl => h.toLowerCase() === cl.toLowerCase()));
        
        next.fullName = findMatch(["fullName", "name", "full_name", "Full Name", "Candidate Name"]) || "";
        next.email = findMatch(["email", "Email", "Mail"]) || "";
        next.headline = findMatch(["headline", "Headline", "Title", "Position"]) || "";
        next.location = findMatch(["location", "Location", "City", "Country"]) || "";
        next.skillsList = findMatch(["skills", "Skills", "Skills list", "Tech stack"]) || "";
        next.yearsExperience = findMatch(["yearsExperience", "experienceYears", "Years", "Total Experience"]) || "";
        next.currentCompany = findMatch(["currentCompany", "Company", "Employer"]) || "";
        next.currentRole = findMatch(["currentRole", "Role", "Job Title"]) || "";
        return next;
      });

      // Auto-detect for Detailed Mapping (Basic Info)
      setDetailedMapping((prev) => {
        const next = { ...prev };
        const findMatch = (hList: string[]) => headers.find(h => hList.some(cl => h.toLowerCase() === cl.toLowerCase()));
        
        next.fullName = findMatch(["fullName", "name", "full_name", "Full Name"]) || "";
        next.email = findMatch(["email", "Email"]) || "";
        next.headline = findMatch(["headline", "Headline"]) || "";
        next.location = findMatch(["location", "Location"]) || "";
        return next;
      });
    }
  }

  function transformSimpleRow(row: Record<string, string>, mapping: SimpleMapping): UmuravaProfile {
    const nameParts = (row[mapping.fullName] || "").split(" ");
    const rawSkills = parseCommaSeparated(row[mapping.skillsList]);
    const rawLevels = parseCommaSeparated(row[mapping.skillLevels]);
    const rawYears = parseCommaSeparated(row[mapping.skillYears]);

    const skills = rawSkills.map((name, i) => ({
      name,
      level: (rawLevels[i] as any) || "Intermediate",
      yearsOfExperience: parseInt(rawYears[i]) || 0
    }));
    
    const yearsExp = parseInt(row[mapping.yearsExperience]) || 0;
    const startDate = getStartDateFromYears(yearsExp);
    
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: row[mapping.email] || "",
      headline: row[mapping.headline] || "",
      location: row[mapping.location] || "",
      bio: row[mapping.bio] || undefined, _resumeUrl: row[mapping.resumeUrl] || "",
      skills: skills.length > 0 ? skills : [{ name: "Not specified", level: "Intermediate", yearsOfExperience: 0 }],
      experience: [{
        company: row[mapping.currentCompany] || "Not specified",
        role: row[mapping.currentRole] || "Not specified",
        "Start Date": startDate,
        "End Date": "Present",
        description: row[mapping.experienceSummary] || "",
        technologies: parseCommaSeparated(row[mapping.technologies]),
        "Is Current": true
      }],
      education: [{
        institution: row[mapping.institution] || "Not specified",
        degree: row[mapping.degree] || "Bachelor's",
        "Field of Study": row[mapping.fieldOfStudy] || "Not specified",
        "Start Year": new Date().getFullYear() - 4,
        "End Year": new Date().getFullYear()
      }],
      projects: [],
      availability: {
        status: normalizeAvailabilityStatus(row[mapping.availabilityStatus]),
        type: normalizeEmploymentType(row[mapping.employmentType])
      }
    };
  }

  function transformDetailedRow(row: Record<string, string>, mapping: DetailedMapping): UmuravaProfile {
    const nameParts = (row[mapping.fullName] || "").split(" ");
    
    const skills = mapping.skills
      .filter(s => !!row[s.name])
      .map(s => ({
        name: row[s.name],
        level: (row[s.level] as any) || "Intermediate",
        yearsOfExperience: parseInt(row[s.years]) || 0
      }));

    const experience = mapping.experience
      .filter(e => !!row[e.company])
      .map((e, i) => ({
        company: row[e.company],
        role: row[e.role],
        "Start Date": row[e.start] || "2020-01",
        "End Date": row[e.end] || (i === 0 ? "Present" : "2022-01"),
        description: row[e.description] || "",
        technologies: parseCommaSeparated(row[e.technologies]),
        "Is Current": i === 0
      }));

    const education = mapping.education
      .filter(ed => !!row[ed.institution])
      .map(ed => ({
        institution: row[ed.institution],
        degree: row[ed.degree] || "Bachelor's",
        "Field of Study": row[ed.field] || "Not specified",
        "Start Year": parseInt(row[ed.start]) || (new Date().getFullYear() - 4),
        "End Year": parseInt(row[ed.end]) || new Date().getFullYear()
      }));

    const projects = mapping.projects
      .filter(p => !!row[p.name])
      .map(p => ({
        name: row[p.name],
        description: row[p.description] || "",
        technologies: parseCommaSeparated(row[p.technologies]),
        role: row[p.role] || "Contributor",
        "Start Date": row[p.start] || "2023-01",
        "End Date": row[p.end] || "2023-06"
      }));

    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: row[mapping.email] || "",
      headline: row[mapping.headline] || "",
      location: row[mapping.location] || "",
      bio: row[mapping.bio] || undefined, _resumeUrl: row[mapping.resumeUrl] || "",
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

  async function handleCsvPreview() {
    if (!csvFile) return;
    setLoadingB(true);
    setIngestErrorB(null);
    setCsvValidationErrors([]);
    
    try {
      const text = await csvFile.text();
      const rows = parseCsvContent(text);
      const profiles: UmuravaProfile[] = [];
      const errors: string[] = [];

      rows.forEach((row, i) => {
        try {
          const profile = csvFormat === "simple" 
            ? transformSimpleRow(row, simpleMapping)
            : transformDetailedRow(row, detailedMapping);
          
          const { error } = validateUmuravaProfile(profile, i);
          if (error) {
            errors.push(error);
          } else {
            profiles.push(profile);
          }
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      });

      setValidatedCsvProfiles(profiles);
      setCsvValidationErrors(errors);
      
      if (profiles.length === 0 && errors.length > 0) {
        setIngestErrorB("No valid candidates found in CSV after transformation.");
      }
    } catch (err: any) {
      setIngestErrorB(err.message || "Transformation failed");
    } finally {
      setLoadingB(false);
    }
  }

  async function submitCsvIngestion() {
    if (!jobId || !csvFile) return;
    setLoadingB(true);
    setIngestErrorB(null);
    try {
      const mapping = csvFormat === "simple" ? simpleMapping : detailedMapping;
      const res = await apiIngestCsv(jobId, csvFile, mapping);
      
      setIngestResultB(res.data || res);
      setIsCsvIngested(true);
      
      if (res.data?.resumeProcessing) {
        setIsPolling(true);
      }
      
      void dispatch(thunkFetchApplicants(jobId) as any);
    } catch (err: any) {
      setIngestErrorB(err?.message ?? "CSV ingestion failed");
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
        setUploadStatus("Resume attached. AI parsing will populate profile fields shortly.");
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } catch (err: any) {
      setUploadStatus(err?.message ?? "Upload failed");
    }
  }

  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-neutral-800">Applicants ingestion</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Add candidates from structured Umurava profiles or from external sources (CSV + resume PDF).
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm focus-ring"
        >
          Continue to screening
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-white px-2">
          <button
            type="button"
            className={`px-6 py-4 text-sm font-medium transition-all relative ${tab === "umurava" ? "text-primary-500" : "text-neutral-500 hover:text-neutral-700"}`}
            onClick={() => setTab("umurava")}
          >
            Umurava profiles
            {tab === "umurava" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500" />}
          </button>
          <button
            type="button"
            className={`px-6 py-4 text-sm font-medium transition-all relative ${tab === "external" ? "text-primary-500" : "text-neutral-500 hover:text-neutral-700"}`}
            onClick={() => setTab("external")}
          >
            External (CSV + PDF)
            {tab === "external" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500" />}
          </button>
        </div>

        <div className="p-6 sm:p-10">
          {tab === "umurava" ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-neutral-800">Talent Profile Ingestion</h2>
                  <p className="text-xs text-neutral-400">Following official Umurava Talent Schema</p>
                </div>
                <div className="flex bg-neutral-100 p-1 rounded-lg">
                  <button
                    onClick={() => setUmuravaInputMode("paste")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${umuravaMode === "paste" ? "bg-white text-primary-500 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    JSON Paste
                  </button>
                  <button
                    onClick={() => setUmuravaInputMode("upload")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${umuravaMode === "upload" ? "bg-white text-primary-500 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    File Upload
                  </button>
                </div>
              </div>

              {umuravaMode === "paste" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-neutral-700">Paste candidate profiles (JSON array)</label>
                    <textarea
                      value={profilesJson}
                      onChange={(e) => {
                        setProfilesJson(e.target.value);
                        handleValidateProfiles(e.target.value);
                      }}
                      placeholder={`[\n  {\n    "firstName": "Amara",\n    "lastName": "Diallo",\n    "email": "amara@example.com",\n    "headline": "Backend Engineer – Node.js & APIs",\n    "location": "Kigali, Rwanda",\n    "skills": [{ "name": "Node.js", "level": "Expert", "yearsOfExperience": 5 }],\n    "experience": [{\n      "company": "Andela",\n      "role": "Backend Engineer",\n      "Start Date": "2020-01",\n      "End Date": "Present",\n      "description": "...",\n      "technologies": ["Node.js"],\n      "Is Current": true\n    }],\n    "education": [{\n      "institution": "University of Rwanda",\n      "degree": "Bachelor's",\n      "Field of Study": "Computer Science",\n      "Start Year": 2015,\n      "End Year": 2019\n    }],\n    "projects": [{\n      "name": "TalentHub",\n      "description": "...",\n      "technologies": ["Node.js"],\n      "role": "Lead",\n      "Start Date": "2023-01",\n      "End Date": "2023-06"\n    }],\n    "availability": {\n      "status": "Available",\n      "type": "Full-time"\n    }\n  }\n]`}
                      className="w-full min-h-[240px] rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-[13px] font-mono focus-ring transition-card"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-xl border-2 border-dashed transition-card p-12 text-center cursor-pointer ${validatedProfiles.length > 0 ? "border-success bg-successLight/30" : "border-neutral-300 bg-white hover:border-primary-500 hover:bg-primary-50"}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) void onJsonFileSelected(f);
                  }}
                  onClick={() => document.getElementById("json-input")?.click()}
                >
                  <input
                    id="json-input"
                    className="hidden"
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onJsonFileSelected(f);
                    }}
                  />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-neutral-700">
                      {validatedProfiles.length > 0 ? (
                        <span>File loaded: <span className="text-success font-bold">{validatedProfiles.length} profiles ready</span></span>
                      ) : (
                        <span>Drop a <span className="font-bold">.json</span> file here, or <span className="text-primary-500 underline">browse</span></span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono italic">Official Umurava schema validation active</div>
                  </div>
                </div>
              )}

              {umuravaErrors.length > 0 && (
                <div className="p-4 rounded-lg bg-dangerLight text-danger border border-danger/20">
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2">Validation Errors</div>
                  <ul className="list-disc list-inside space-y-1">
                    {umuravaErrors.map((err, i) => (
                      <li key={i} className="text-xs">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validatedProfiles.length > 0 && (
                <div className="space-y-6">
                  <div className="text-[12px] font-semibold text-success bg-successLight px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    {validatedProfiles.length} profiles ready to ingest
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validatedProfiles.map((p, idx) => {
                      const isMissingOptional = !p.bio || !p.languages?.length || !p.certifications?.length || !p.socialLinks || Object.keys(p.socialLinks).length === 0;
                      return (
                        <div key={idx} className="p-5 rounded-xl border border-neutral-200 bg-white space-y-4 shadow-sm hover:shadow-card transition-card relative">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 max-w-[70%]">
                              <h3 className="text-[14px] font-semibold text-neutral-800 truncate">{p.firstName} {p.lastName}</h3>
                              <p className="text-[13px] text-neutral-500 truncate">{p.headline}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                p.availability.status === "Available" ? "bg-successLight text-success border-success/20" :
                                p.availability.status === "Open to Opportunities" ? "bg-warningLight text-warning border-warning/20" :
                                "bg-neutral-100 text-neutral-500 border-neutral-200"
                              }`}>
                                {p.availability.status}
                              </span>
                              {isMissingOptional && (
                                <div className="tooltip-container">
                                  <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="tooltip-text">Some optional fields missing — AI scoring may be less detailed</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[12px] text-neutral-400">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="truncate">{p.location}</span>
                            </div>
                            <div className="h-3 w-[1px] bg-neutral-200" />
                            <div className="flex-shrink-0">{p.experience.length} roles</div>
                            <div className="h-3 w-[1px] bg-neutral-200" />
                            <div className="flex-shrink-0">{p.projects.length} projects</div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            {p.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-primary-50 text-[11px] text-primary-500 font-medium">
                                {s.name}
                              </span>
                            ))}
                            {p.skills.length > 3 && <span className="text-[11px] text-neutral-400">+{p.skills.length - 3} more</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {ingestResultA && (
                <div className="p-6 rounded-xl bg-successLight border border-success/20 space-y-4 animate-fade-in-up shadow-sm">
                  <div className="flex items-center gap-3 text-success">
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold">{ingestResultA.count} profiles ingested successfully. Ready to run screening.</span>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-neutral-800 px-6 py-3 rounded-lg hover:bg-neutral-900 transition-colors shadow-sm focus-ring"
                  >
                    Run screening now
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </div>
              )}

              {ingestErrorA && (
                <div className="p-4 rounded-lg bg-dangerLight text-danger text-sm font-semibold border border-danger/20">
                  {ingestErrorA}
                </div>
              )}

              {!isIngested && (
                <div className="pt-4">
                  <button
                    type="button"
                    disabled={loadingA || validatedProfiles.length === 0}
                    onClick={() => void submitUmuravaProfiles()}
                    className="px-10 py-3.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm flex items-center gap-3"
                  >
                    {loadingA ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ingesting...
                      </>
                    ) : (
                      `Ingest ${validatedProfiles.length} profiles`
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-800">1) Upload CSV</div>
                  <div className="text-xs text-neutral-400">We auto-detect headers for mapping</div>
                </div>
                <div
                  className={`rounded-xl border-2 border-dashed transition-card p-10 text-center cursor-pointer ${csvFile ? "border-success bg-successLight/30" : "border-neutral-300 bg-white hover:border-primary-500 hover:bg-primary-50"}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) void onCsvSelected(f);
                  }}
                  onClick={() => document.getElementById("csv-input")?.click()}
                >
                  <input
                    id="csv-input"
                    className="hidden"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onCsvSelected(f);
                    }}
                  />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-neutral-700">
                      {csvFile ? (
                        <span>Selected: <span className="text-success font-bold">{csvFile.name}</span></span>
                      ) : (
                        <span>Drop CSV here or <span className="text-primary-500 underline">browse files</span></span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold">Supported format: .csv (UTF-8)</div>
                  </div>
                </div>
              </div>

              {csvFile && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-neutral-800">What does your CSV look like?</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        onClick={() => setCsvFormat("simple")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${csvFormat === "simple" ? "border-primary-500 bg-primary-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${csvFormat === "simple" ? "border-primary-500" : "border-neutral-300"}`}>
                            {csvFormat === "simple" && <div className="h-2 w-2 rounded-full bg-primary-500" />}
                          </div>
                          <span className="text-sm font-bold text-neutral-800">Simple format</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">One row per candidate. Skills and experience stored as comma-separated values in single cells.</p>
                      </div>
                      <div 
                        onClick={() => setCsvFormat("detailed")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${csvFormat === "detailed" ? "border-primary-500 bg-primary-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${csvFormat === "detailed" ? "border-primary-500" : "border-neutral-300"}`}>
                            {csvFormat === "detailed" && <div className="h-2 w-2 rounded-full bg-primary-500" />}
                          </div>
                          <span className="text-sm font-bold text-neutral-800">Detailed format</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">Expanded columns. Separate columns for each skill, work role, and project (e.g., skill_1, skill_2).</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-neutral-800">2) Map CSV columns</div>
                        <div className="text-xs text-neutral-400">Connect headers to Umurava's candidate schema.</div>
                      </div>
                      <div className="text-[11px] font-bold text-primary-500 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        {csvHeaders.length} headers detected
                      </div>
                    </div>

                    {csvFormat === "simple" ? (
                      <div className="space-y-10">
                        {SIMPLE_MAPPING_FIELDS.map((section) => (
                          <div key={section.section} className="space-y-5">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">{section.section}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                              {section.fields.map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="text-[13px] font-medium text-neutral-700">{f.label}</div>
                                    {f.key === "resumeUrl" && (
                                      <div className="group relative">
                                        <svg className="h-3.5 w-3.5 text-neutral-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-neutral-800 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl leading-relaxed">
                                          When a Resume URL is provided, our AI automatically downloads and parses each candidate's resume, enriching their profile with detailed skills, experience, and project data. Candidates without a resume URL are scored on CSV fields only.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <select
                                    value={simpleMapping[f.key]}
                                    onChange={(e) => setSimpleMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus-ring transition-card"
                                  >
                                    <option value="">(not provided)</option>
                                    {csvHeaders.map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                  {f.key === "resumeUrl" && (
                                    <p className="text-[12px] text-neutral-500 italic px-0.5">
                                      Supports Google Drive, Dropbox, and direct PDF links. Resumes are fetched and parsed automatically — no manual upload needed.
                                    </p>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                          <p className="text-[12px] text-neutral-500 leading-relaxed italic">
                            <strong>Note:</strong> Simple format creates one experience entry and one education entry per candidate. Missing fields get safe defaults. For richer profiles, use Detailed format or the Umurava Profiles tab.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {/* Detailed Basic Info */}
                        <div className="space-y-5">
                          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Basic Info</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                            {[
                              { key: "fullName", label: "Full Name" },
                              { key: "email", label: "Email" },
                              { key: "headline", label: "Headline" },
                              { key: "location", label: "Location" },
                              { key: "resumeUrl", label: "Resume URL" },
                              { key: "bio", label: "Bio" }
                            ].map((f) => (
                              <label key={f.key} className="block space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="text-[13px] font-medium text-neutral-700">{f.label}</div>
                                  {f.key === "resumeUrl" && (
                                    <div className="group relative">
                                      <svg className="h-3.5 w-3.5 text-neutral-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-neutral-800 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl leading-relaxed">
                                        When a Resume URL is provided, our AI automatically downloads and parses each candidate's resume, enriching their profile with detailed skills, experience, and project data. Candidates without a resume URL are scored on CSV fields only.
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <select
                                  value={(detailedMapping as any)[f.key]}
                                  onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus-ring transition-card"
                                >
                                  <option value="">(not provided)</option>
                                  {csvHeaders.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                {f.key === "resumeUrl" && (
                                  <p className="text-[12px] text-neutral-500 italic px-0.5">
                                    Supports Google Drive, Dropbox, and direct PDF links. Resumes are fetched and parsed automatically — no manual upload needed.
                                  </p>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Skills */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Skills (Max 5)</div>
                            {detailedMapping.skills.length < 5 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, skills: [...prev.skills, { name: "", level: "", years: "" }] }))}
                                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest"
                              >
                                + Add skill column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-4">
                            {detailedMapping.skills.map((s, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-neutral-50/50 border border-neutral-100 relative">
                                <label className="block space-y-1.5">
                                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Skill {idx+1} Name</div>
                                  <select
                                    value={s.name}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].name = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                <label className="block space-y-1.5">
                                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Level</div>
                                  <select
                                    value={s.level}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].level = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                <label className="block space-y-1.5">
                                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Years</div>
                                  <select
                                    value={s.years}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].years = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-danger flex items-center justify-center shadow-sm transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Experience */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Experience (Max 3)</div>
                            {detailedMapping.experience.length < 3 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, experience: [...prev.experience, { company: "", role: "", start: "", end: "", description: "", technologies: "" }] }))}
                                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest"
                              >
                                + Add experience column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.experience.map((exp, idx) => (
                              <div key={idx} className="p-6 rounded-xl bg-neutral-50/50 border border-neutral-100 space-y-5 relative">
                                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider italic">Role {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Company</div>
                                    <select
                                      value={exp.company}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].company = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Job Title</div>
                                    <select
                                      value={exp.role}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].role = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <label className="block space-y-1.5">
                                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Start Date</div>
                                      <select
                                        value={exp.start}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.experience];
                                          next[idx].start = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, experience: next }));
                                        }}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                      <p className="text-[9px] text-neutral-400">YYYY-MM or MM/YYYY</p>
                                    </label>
                                    <label className="block space-y-1.5">
                                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">End Date</div>
                                      <select
                                        value={exp.end}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.experience];
                                          next[idx].end = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, experience: next }));
                                        }}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                      <p className="text-[9px] text-neutral-400">YYYY-MM or Present</p>
                                    </label>
                                  </div>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Technologies</div>
                                    <select
                                      value={exp.technologies}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].technologies = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                </div>
                                <label className="block space-y-1.5">
                                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Description</div>
                                  <select
                                    value={exp.description}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.experience];
                                      next[idx].description = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, experience: next }));
                                    }}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-danger flex items-center justify-center shadow-sm transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Education */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Education (Max 2)</div>
                            {detailedMapping.education.length < 2 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, education: [...prev.education, { institution: "", degree: "", field: "", start: "", end: "" }] }))}
                                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest"
                              >
                                + Add education column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.education.map((edu, idx) => (
                              <div key={idx} className="p-6 rounded-xl bg-neutral-50/50 border border-neutral-100 space-y-5 relative">
                                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider italic">Degree {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Institution</div>
                                    <select
                                      value={edu.institution}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].institution = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Degree</div>
                                    <select
                                      value={edu.degree}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].degree = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Field of Study</div>
                                    <select
                                      value={edu.field}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].field = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <label className="block space-y-1.5">
                                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Start Year</div>
                                      <select
                                        value={edu.start}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.education];
                                          next[idx].start = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, education: next }));
                                        }}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                    </label>
                                    <label className="block space-y-1.5">
                                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">End Year</div>
                                      <select
                                        value={edu.end}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.education];
                                          next[idx].end = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, education: next }));
                                        }}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                    </label>
                                  </div>
                                </div>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-danger flex items-center justify-center shadow-sm transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Projects */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Projects (Max 3)</div>
                            {detailedMapping.projects.length < 3 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, projects: [...prev.projects, { name: "", description: "", technologies: "", role: "", start: "", end: "" }] }))}
                                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest"
                              >
                                + Add project column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.projects.map((proj, idx) => (
                              <div key={idx} className="p-6 rounded-xl bg-neutral-50/50 border border-neutral-100 space-y-5 relative">
                                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider italic">Project {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Project Name</div>
                                    <select
                                      value={proj.name}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].name = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Role in Project</div>
                                    <select
                                      value={proj.role}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].role = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Technologies</div>
                                    <select
                                      value={proj.technologies}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].technologies = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1.5">
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Description</div>
                                    <select
                                      value={proj.description}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].description = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-xs focus-ring"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                </div>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-danger flex items-center justify-center shadow-sm transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Misc */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                          <div className="space-y-5">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Availability</div>
                            <div className="grid grid-cols-1 gap-5">
                              {[
                                { key: "availabilityStatus", label: "Status" },
                                { key: "employmentType", label: "Type" }
                              ].map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="text-[13px] font-medium text-neutral-700">{f.label}</div>
                                  <select
                                    value={(detailedMapping as any)[f.key]}
                                    onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus-ring transition-card"
                                  >
                                    <option value="">(not provided)</option>
                                    {csvHeaders.map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-5">
                            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Social Links</div>
                            <div className="grid grid-cols-1 gap-5">
                              {[
                                { key: "linkedin", label: "LinkedIn" },
                                { key: "github", label: "GitHub" },
                                { key: "portfolio", label: "Portfolio" }
                              ].map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="text-[13px] font-medium text-neutral-700">{f.label}</div>
                                  <select
                                    value={(detailedMapping as any)[f.key]}
                                    onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus-ring transition-card"
                                  >
                                    <option value="">(not provided)</option>
                                    {csvHeaders.map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-8 flex flex-col sm:flex-row items-center gap-6 border-t border-neutral-100">
                      <button
                        type="button"
                        disabled={loadingB}
                        onClick={() => void handleCsvPreview()}
                        className="w-full sm:w-auto px-10 py-3.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:bg-neutral-300 transition-all shadow-sm focus-ring"
                      >
                        {loadingB ? "Transforming..." : "Preview candidates"}
                      </button>
                      <p className="text-[12px] text-neutral-400 italic">Validate mappings before final ingestion.</p>
                    </div>
                  </div>
                </div>
              )}

              {csvValidationErrors.length > 0 && (
                <div className="p-4 rounded-lg bg-warningLight/50 text-warning border border-warning/20">
                  <div className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Mapping Warnings ({csvValidationErrors.length})
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {csvValidationErrors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs">{err}</li>
                    ))}
                    {csvValidationErrors.length > 5 && <li className="text-xs italic">...and {csvValidationErrors.length - 5} more</li>}
                  </ul>
                </div>
              )}

              {validatedCsvProfiles.length > 0 && (
                <div className="space-y-8 animate-fade-in-up">
                  <div className="text-[12px] font-semibold text-success bg-successLight px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    {validatedCsvProfiles.length} candidates transformed successfully
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validatedCsvProfiles.map((p, idx) => {
                      const hasNoProjects = p.projects.length === 0;
                      return (
                        <div key={idx} className="p-5 rounded-xl border border-neutral-200 bg-white space-y-4 shadow-sm hover:shadow-card transition-card relative">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 max-w-[70%]">
                              <h3 className="text-[14px] font-semibold text-neutral-800 truncate">{p.firstName} {p.lastName}</h3>
                              <p className="text-[13px] text-neutral-500 truncate">{p.headline}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                                p.availability.status === "Available" ? "bg-successLight text-success border-success/20" :
                                p.availability.status === "Open to Opportunities" ? "bg-warningLight text-warning border-warning/20" :
                                "bg-neutral-100 text-neutral-500 border-neutral-200"
                              }`}>
                                {p.availability.status}
                              </span>
                              {hasNoProjects && (
                                <div className="tooltip-container">
                                  <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="tooltip-text">No projects detected. AI relevance scoring will be lower.</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[12px] text-neutral-400">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="truncate">{p.location}</span>
                            </div>
                            <div className="h-3 w-[1px] bg-neutral-200" />
                            <div className="flex-shrink-0">{p.experience.length} roles</div>
                            <div className="h-3 w-[1px] bg-neutral-200" />
                            <div className="flex-shrink-0">{p.projects.length} projects</div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            {p.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-primary-50 text-[11px] text-primary-500 font-medium">
                                {s.name}
                              </span>
                            ))}
                            {p.skills.length > 3 && <span className="text-[11px] text-neutral-400">+{p.skills.length - 3} more</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!isCsvIngested && (
                    <div className="pt-4">
                      <button
                        type="button"
                        disabled={loadingB || validatedCsvProfiles.length === 0}
                        onClick={() => void submitCsvIngestion()}
                        className="px-12 py-4 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 disabled:bg-neutral-300 transition-all shadow-sm active:scale-[0.98]"
                      >
                        {loadingB ? "Ingesting..." : `Ingest ${validatedCsvProfiles.length} candidates`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {ingestResultB && (
                <div className="space-y-6 animate-fade-in-up">
                  {ingestResultB.resumeProcessing || (parseStatus && parseStatus.processing) ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-successLight flex items-center justify-center">
                            <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-[15px] font-bold text-neutral-800">{ingestResultB.rowsCreated} profiles saved</span>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span className="text-neutral-600">Parsing resumes in background...</span>
                          <span className="text-neutral-800">{parseStatus?.resumeParsed ?? 0} / {parseStatus?.total ?? ingestResultB.rowsCreated}</span>
                        </div>
                        
                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 transition-all duration-500 ease-out" 
                            style={{ width: `${((parseStatus?.resumeParsed ?? 0) / (parseStatus?.total ?? ingestResultB.rowsCreated)) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-500">
                          <span>{(parseStatus?.resumeParsed ?? 0)} resumes parsed</span>
                          <span className="text-neutral-300">•</span>
                          <span>{(parseStatus?.total ?? ingestResultB.rowsCreated) - (parseStatus?.resumeParsed ?? 0)} pending</span>
                          {parseStatus?.parseErrors ? (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className="text-danger">{parseStatus.parseErrors} errors</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-neutral-100 mt-6 pt-6">
                        <button
                          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
                          className="w-full sm:w-auto px-8 py-3 bg-primary-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-600 transition-all"
                        >
                          Run screening now
                        </button>
                        <button
                          disabled={parseStatus?.processing !== false}
                          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/shortlist`)}
                          className="w-full sm:w-auto px-8 py-3 bg-white border border-neutral-200 text-neutral-600 rounded-lg text-sm font-bold hover:bg-neutral-50 disabled:bg-neutral-50 disabled:text-neutral-400 transition-all"
                        >
                          {parseStatus?.processing === false ? "View candidates" : "Wait for all resumes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-successLight border border-success/20 space-y-4 shadow-sm">
                      <div className="flex items-center gap-3 text-success">
                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold">
                          {parseStatus 
                            ? `All ${parseStatus.total} profiles ready. ${parseStatus.resumeParsed} resume-enriched, ${parseStatus.csvOnly} CSV-only.`
                            : `Successfully ingested ${ingestResultB.rowsCreated} candidates. ${ingestResultB.resumeEnriched || 0} resume-enriched.`
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-neutral-800 px-6 py-3 rounded-lg hover:bg-neutral-900 transition-colors shadow-sm focus-ring"
                      >
                        Go to screening
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {ingestErrorB && (
                <div className="p-4 rounded-lg bg-dangerLight text-danger text-sm font-semibold border border-danger/20">
                  {ingestErrorB}
                </div>
              )}

              {csvFile && (
                <div className="rounded-xl border border-neutral-200 bg-[#F8FAFC] p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="text-[15px] font-bold text-neutral-800">How resume parsing works</div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-bold text-neutral-700">Candidates with a Resume URL</div>
                        <p className="text-[13px] text-neutral-500 leading-relaxed">
                          AI fetches and parses each PDF automatically. Skills, experience, and projects are extracted and merged into the candidate profile.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-bold text-neutral-700">Candidates without a Resume URL</div>
                        <p className="text-[13px] text-neutral-500 leading-relaxed">
                          Scored on CSV fields only (skills list, experience summary, education). AI scoring may be less detailed for these candidates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Supported Formats</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-neutral-600 font-medium">
                      <span>Google Drive</span>
                      <span className="text-neutral-300">•</span>
                      <span>Dropbox</span>
                      <span className="text-neutral-300">•</span>
                      <span>Direct PDF URL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
