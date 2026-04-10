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

  // --- External CSV + PDF State ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvFormat, setCsvFormat] = useState<CsvFormat>("simple");
  
  const [simpleMapping, setSimpleMapping] = useState<SimpleMapping>({
    fullName: "", email: "", headline: "", location: "", bio: "",
    skillsList: "", skillLevels: "", skillYears: "",
    currentCompany: "", currentRole: "", yearsExperience: "", experienceSummary: "", technologies: "",
    institution: "", degree: "", fieldOfStudy: "",
    availabilityStatus: "", employmentType: ""
  });

  const [detailedMapping, setDetailedMapping] = useState<DetailedMapping>({
    fullName: "", email: "", headline: "", location: "", bio: "",
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
      bio: row[mapping.bio] || undefined,
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
      bio: row[mapping.bio] || undefined,
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
    if (!jobId || validatedCsvProfiles.length === 0) return;
    setLoadingB(true);
    setIngestErrorB(null);
    try {
      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles: validatedCsvProfiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setIngestResultB(resAction.payload.data ?? resAction.payload);
        setIsCsvIngested(true);
        void dispatch(thunkFetchApplicants(jobId) as any);
      } else {
        throw new Error(resAction.error.message || "CSV ingestion failed");
      }
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
          <h1 className="page-title">Applicants ingestion</h1>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Add candidates from structured Umurava profiles or from external sources (CSV + resume PDF).
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
          className="w-full sm:w-auto rounded-xl px-6 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] transition-card focus-ring shadow-soft font-medium"
        >
          Continue to screening
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:shadow-soft border-y sm:border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100 p-2 sm:p-4 bg-gray-50/50">
          <button
            type="button"
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-card focus-ring ${tab === "umurava" ? "bg-[#1F2A37] text-white shadow-soft" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setTab("umurava")}
          >
            Umurava profiles
          </button>
          <button
            type="button"
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-card focus-ring ${tab === "external" ? "bg-[#1F2A37] text-white shadow-soft" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setTab("external")}
          >
            External (CSV + PDF)
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {tab === "umurava" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-gray-900">Talent Profile Ingestion</h2>
                  <p className="text-xs text-gray-500 italic">Following official Umurava Talent Schema</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setUmuravaInputMode("paste")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${umuravaMode === "paste" ? "bg-white text-[#1F2A37] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    JSON Paste
                  </button>
                  <button
                    onClick={() => setUmuravaInputMode("upload")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${umuravaMode === "upload" ? "bg-white text-[#1F2A37] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    File Upload
                  </button>
                </div>
              </div>

              {umuravaMode === "paste" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Paste candidate profiles (JSON array)</label>
                    <textarea
                      value={profilesJson}
                      onChange={(e) => {
                        setProfilesJson(e.target.value);
                        handleValidateProfiles(e.target.value);
                      }}
                      placeholder={`[\n  {\n    "firstName": "Amara",\n    "lastName": "Diallo",\n    "email": "amara@example.com",\n    "headline": "Backend Engineer – Node.js & APIs",\n    "location": "Kigali, Rwanda",\n    "skills": [{ "name": "Node.js", "level": "Expert", "yearsOfExperience": 5 }],\n    "experience": [{\n      "company": "Andela",\n      "role": "Backend Engineer",\n      "Start Date": "2020-01",\n      "End Date": "Present",\n      "description": "...",\n      "technologies": ["Node.js"],\n      "Is Current": true\n    }],\n    "education": [{\n      "institution": "University of Rwanda",\n      "degree": "Bachelor's",\n      "Field of Study": "Computer Science",\n      "Start Year": 2015,\n      "End Year": 2019\n    }],\n    "projects": [{\n      "name": "TalentHub",\n      "description": "...",\n      "technologies": ["Node.js"],\n      "role": "Lead",\n      "Start Date": "2023-01",\n      "End Date": "2023-06"\n    }],\n    "availability": {\n      "status": "Available",\n      "type": "Full-time"\n    }\n  }\n]`}
                      className="w-full min-h-[200px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-mono focus-ring transition-card"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl border-2 border-dashed transition-card p-10 text-center cursor-pointer ${validatedProfiles.length > 0 ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"}`}
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
                    <div className="text-sm font-medium text-gray-700">
                      {validatedProfiles.length > 0 ? (
                        <span>File loaded: <span className="text-green-700 font-bold">JSON ready ({validatedProfiles.length} profiles)</span></span>
                      ) : (
                        <span>Drop a <span className="font-bold">.json</span> file here, or click to choose</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono italic">Official Umurava schema validation active</div>
                  </div>
                </div>
              )}

              {umuravaErrors.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="text-xs font-bold text-red-800 uppercase tracking-widest">Validation Errors</div>
                  <ul className="list-disc list-inside space-y-1">
                    {umuravaErrors.map((err, i) => (
                      <li key={i} className="text-xs text-red-600">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validatedProfiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {validatedProfiles.length} profiles ready to ingest
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validatedProfiles.map((p, idx) => {
                      const isMissingOptional = !p.bio || !p.languages?.length || !p.certifications?.length || !p.socialLinks || Object.keys(p.socialLinks).length === 0;
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-sm hover:shadow-soft transition-card relative">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 max-w-[70%]">
                              <h3 className="text-sm font-bold text-gray-900 truncate">{p.firstName} {p.lastName}</h3>
                              <p className="text-[11px] text-gray-500 font-medium truncate">{p.headline}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                                p.availability.status === "Available" ? "bg-green-100 text-green-700 border-green-200" :
                                p.availability.status === "Open to Opportunities" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                "bg-gray-100 text-gray-500 border-gray-200"
                              }`}>
                                {p.availability.status}
                              </span>
                              {isMissingOptional && (
                                <div className="tooltip-container">
                                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="tooltip-text">Some optional fields missing — AI scoring may be less detailed</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <div className="flex items-center gap-1 min-w-0">
                              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="truncate">{p.location}</span>
                            </div>
                            <div className="font-bold text-gray-300">|</div>
                            <div className="flex-shrink-0">{p.experience.length} roles</div>
                            <div className="font-bold text-gray-300">|</div>
                            <div className="flex-shrink-0">{p.projects.length} projects</div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.skills.length} skills:</span>
                            {p.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-600 font-medium">
                                {s.name}
                              </span>
                            ))}
                            {p.skills.length > 3 && <span className="text-[10px] text-gray-400">+{p.skills.length - 3} more</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {ingestResultA && (
                <div className="p-5 rounded-xl bg-green-50 border border-green-100 space-y-4 animate-fade-in-up shadow-sm">
                  <div className="flex items-center gap-3 text-green-800">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold">{ingestResultA.count} profiles ingested successfully. Ready to run screening.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#1F2A37] px-5 py-2.5 rounded-lg hover:bg-[#152030] transition-colors shadow-sm focus-ring"
                    >
                      Run screening now
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {ingestErrorA && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 animate-pulse-slow">
                  {ingestErrorA}
                </div>
              )}

              {!isIngested && (
                <button
                  type="button"
                  disabled={loadingA || validatedProfiles.length === 0}
                  onClick={() => void submitUmuravaProfiles()}
                  className="w-full sm:w-auto rounded-xl px-10 py-4 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 transition-all font-bold focus-ring shadow-soft flex items-center justify-center gap-3"
                >
                  {loadingA ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ingesting profiles...
                    </>
                  ) : (
                    `Ingest ${validatedProfiles.length} profiles`
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">1) Upload CSV</div>
                  <div className="text-xs text-gray-500">We auto-detect headers for mapping</div>
                </div>
                <div
                  className={`rounded-2xl border-2 border-dashed transition-card p-8 text-center cursor-pointer ${csvFile ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"}`}
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
                    <div className="text-sm font-medium text-gray-700">
                      {csvFile ? (
                        <span>Selected: <span className="text-green-700 font-bold">{csvFile.name}</span></span>
                      ) : (
                        <span>Drop CSV here or <span className="text-blue-600 underline">browse files</span></span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">Supported format: .csv (UTF-8)</div>
                  </div>
                </div>
              </div>

              {csvFile && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900">What does your CSV look like?</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        onClick={() => setCsvFormat("simple")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${csvFormat === "simple" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${csvFormat === "simple" ? "border-blue-500" : "border-gray-300"}`}>
                            {csvFormat === "simple" && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <span className="text-sm font-bold text-gray-900">Simple format</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">One row per candidate. Skills and experience stored as comma-separated values in single cells.</p>
                      </div>
                      <div 
                        onClick={() => setCsvFormat("detailed")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${csvFormat === "detailed" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${csvFormat === "detailed" ? "border-blue-500" : "border-gray-300"}`}>
                            {csvFormat === "detailed" && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <span className="text-sm font-bold text-gray-900">Detailed format</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">Expanded columns. Separate columns for each skill, work role, and project (e.g., skill_1, skill_2).</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">2) Map CSV columns</div>
                        <div className="text-xs text-gray-500">Connect headers to Umurava's candidate schema.</div>
                      </div>
                      <div className="text-xs font-bold text-[#1F2A37] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        {csvHeaders.length} headers detected
                      </div>
                    </div>

                    {csvFormat === "simple" ? (
                      <div className="space-y-8">
                        {SIMPLE_MAPPING_FIELDS.map((section) => (
                          <div key={section.section} className="space-y-4">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">{section.section}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {section.fields.map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="text-xs font-semibold text-gray-700">{f.label}</div>
                                  <select
                                    value={simpleMapping[f.key]}
                                    onChange={(e) => setSimpleMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus-ring transition-card"
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
                        ))}
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-xs text-gray-500 leading-relaxed italic">
                            <strong>Note:</strong> Simple format creates one experience entry and one education entry per candidate. Missing fields get safe defaults. For richer profiles, use Detailed format or the Umurava Profiles tab.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {/* Detailed Basic Info */}
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Basic Info</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {[
                              { key: "fullName", label: "Full Name" },
                              { key: "email", label: "Email" },
                              { key: "headline", label: "Headline" },
                              { key: "location", label: "Location" },
                              { key: "bio", label: "Bio" }
                            ].map((f) => (
                              <label key={f.key} className="block space-y-1.5">
                                <div className="text-xs font-semibold text-gray-700">{f.label}</div>
                                <select
                                  value={(detailedMapping as any)[f.key]}
                                  onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus-ring transition-card"
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

                        {/* Detailed Skills */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skills (Max 5)</div>
                            {detailedMapping.skills.length < 5 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, skills: [...prev.skills, { name: "", level: "", years: "" }] }))}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                              >
                                + Add skill column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-4">
                            {detailedMapping.skills.map((s, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 relative">
                                <label className="block space-y-1">
                                  <div className="text-[10px] font-bold text-gray-500">Skill {idx+1} Name</div>
                                  <select
                                    value={s.name}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].name = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                <label className="block space-y-1">
                                  <div className="text-[10px] font-bold text-gray-500">Level</div>
                                  <select
                                    value={s.level}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].level = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                <label className="block space-y-1">
                                  <div className="text-[10px] font-bold text-gray-500">Years</div>
                                  <select
                                    value={s.years}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.skills];
                                      next[idx].years = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, skills: next }));
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Experience */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Experience (Max 3)</div>
                            {detailedMapping.experience.length < 3 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, experience: [...prev.experience, { company: "", role: "", start: "", end: "", description: "", technologies: "" }] }))}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                              >
                                + Add experience column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.experience.map((exp, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 space-y-4 relative">
                                <div className="text-[10px] font-bold text-gray-400 italic">Role {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Company</div>
                                    <select
                                      value={exp.company}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].company = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Job Title</div>
                                    <select
                                      value={exp.role}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].role = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <label className="block space-y-1">
                                      <div className="text-[10px] font-bold text-gray-500">Start Date</div>
                                      <select
                                        value={exp.start}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.experience];
                                          next[idx].start = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, experience: next }));
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                      <p className="text-[9px] text-gray-400">YYYY-MM or MM/YYYY</p>
                                    </label>
                                    <label className="block space-y-1">
                                      <div className="text-[10px] font-bold text-gray-500">End Date</div>
                                      <select
                                        value={exp.end}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.experience];
                                          next[idx].end = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, experience: next }));
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                      <p className="text-[9px] text-gray-400">YYYY-MM or Present</p>
                                    </label>
                                  </div>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Technologies (comma separated)</div>
                                    <select
                                      value={exp.technologies}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.experience];
                                        next[idx].technologies = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, experience: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                </div>
                                <label className="block space-y-1">
                                  <div className="text-[10px] font-bold text-gray-500">Description</div>
                                  <select
                                    value={exp.description}
                                    onChange={(e) => {
                                      const next = [...detailedMapping.experience];
                                      next[idx].description = e.target.value;
                                      setDetailedMapping(prev => ({ ...prev, experience: next }));
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                  >
                                    <option value="">(select column)</option>
                                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </label>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Education */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Education (Max 2)</div>
                            {detailedMapping.education.length < 2 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, education: [...prev.education, { institution: "", degree: "", field: "", start: "", end: "" }] }))}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                              >
                                + Add education column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.education.map((edu, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 space-y-4 relative">
                                <div className="text-[10px] font-bold text-gray-400 italic">Degree {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Institution</div>
                                    <select
                                      value={edu.institution}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].institution = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Degree</div>
                                    <select
                                      value={edu.degree}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].degree = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Field of Study</div>
                                    <select
                                      value={edu.field}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.education];
                                        next[idx].field = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, education: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <label className="block space-y-1">
                                      <div className="text-[10px] font-bold text-gray-500">Start Year</div>
                                      <select
                                        value={edu.start}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.education];
                                          next[idx].start = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, education: next }));
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                      >
                                        <option value="">(select column)</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                      </select>
                                    </label>
                                    <label className="block space-y-1">
                                      <div className="text-[10px] font-bold text-gray-500">End Year</div>
                                      <select
                                        value={edu.end}
                                        onChange={(e) => {
                                          const next = [...detailedMapping.education];
                                          next[idx].end = e.target.value;
                                          setDetailedMapping(prev => ({ ...prev, education: next }));
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
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
                                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Projects */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projects (Max 3)</div>
                            {detailedMapping.projects.length < 3 && (
                              <button 
                                onClick={() => setDetailedMapping(prev => ({ ...prev, projects: [...prev.projects, { name: "", description: "", technologies: "", role: "", start: "", end: "" }] }))}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                              >
                                + Add project column set
                              </button>
                            )}
                          </div>
                          <div className="space-y-6">
                            {detailedMapping.projects.map((proj, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 space-y-4 relative">
                                <div className="text-[10px] font-bold text-gray-400 italic">Project {idx+1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Project Name</div>
                                    <select
                                      value={proj.name}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].name = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Role in Project</div>
                                    <select
                                      value={proj.role}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].role = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Technologies Used</div>
                                    <select
                                      value={proj.technologies}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].technologies = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                  <label className="block space-y-1">
                                    <div className="text-[10px] font-bold text-gray-500">Description</div>
                                    <select
                                      value={proj.description}
                                      onChange={(e) => {
                                        const next = [...detailedMapping.projects];
                                        next[idx].description = e.target.value;
                                        setDetailedMapping(prev => ({ ...prev, projects: next }));
                                      }}
                                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                    >
                                      <option value="">(select column)</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </label>
                                </div>
                                {idx > 0 && (
                                  <button 
                                    onClick={() => setDetailedMapping(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }))}
                                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 flex items-center justify-center shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Misc */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="space-y-4">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Availability</div>
                            <div className="grid grid-cols-1 gap-4">
                              {[
                                { key: "availabilityStatus", label: "Status" },
                                { key: "employmentType", label: "Type" }
                              ].map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="text-xs font-semibold text-gray-700">{f.label}</div>
                                  <select
                                    value={(detailedMapping as any)[f.key]}
                                    onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus-ring transition-card"
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
                          <div className="space-y-4">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Social Links</div>
                            <div className="grid grid-cols-1 gap-4">
                              {[
                                { key: "linkedin", label: "LinkedIn" },
                                { key: "github", label: "GitHub" },
                                { key: "portfolio", label: "Portfolio" }
                              ].map((f) => (
                                <label key={f.key} className="block space-y-1.5">
                                  <div className="text-xs font-semibold text-gray-700">{f.label}</div>
                                  <select
                                    value={(detailedMapping as any)[f.key]}
                                    onChange={(e) => setDetailedMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus-ring transition-card"
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

                    <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={loadingB}
                        onClick={() => void handleCsvPreview()}
                        className="w-full sm:w-auto rounded-xl px-10 py-4 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 transition-card font-bold focus-ring shadow-soft"
                      >
                        {loadingB ? "Transforming..." : "Preview candidates"}
                      </button>
                      <p className="text-[11px] text-gray-400 italic">Click preview to validate mappings before final ingestion.</p>
                    </div>
                  </div>
                </div>
              )}

              {csvValidationErrors.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Mapping Warnings ({csvValidationErrors.length})
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {csvValidationErrors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs text-amber-700">{err}</li>
                    ))}
                    {csvValidationErrors.length > 5 && <li className="text-xs text-amber-700 italic">...and {csvValidationErrors.length - 5} more</li>}
                  </ul>
                  <p className="text-[10px] text-amber-600 mt-2 font-medium">Candidates with errors will be skipped. Others will be ingested with defaults.</p>
                </div>
              )}

              {validatedCsvProfiles.length > 0 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {validatedCsvProfiles.length} candidates transformed successfully
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validatedCsvProfiles.map((p, idx) => {
                      const hasNoProjects = p.projects.length === 0;
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-sm hover:shadow-soft transition-card relative">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5 max-w-[70%]">
                              <h3 className="text-sm font-bold text-gray-900 truncate">{p.firstName} {p.lastName}</h3>
                              <p className="text-[11px] text-gray-500 font-medium truncate">{p.headline}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                                p.availability.status === "Available" ? "bg-green-100 text-green-700 border-green-200" :
                                p.availability.status === "Open to Opportunities" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                "bg-gray-100 text-gray-500 border-gray-200"
                              }`}>
                                {p.availability.status}
                              </span>
                              {hasNoProjects && (
                                <div className="tooltip-container">
                                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="tooltip-text">No projects detected. AI relevance scoring will be lower.</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <div className="flex items-center gap-1 min-w-0">
                              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="truncate">{p.location}</span>
                            </div>
                            <div className="font-bold text-gray-300">|</div>
                            <div className="flex-shrink-0">{p.experience.length} roles</div>
                            <div className="font-bold text-gray-300">|</div>
                            <div className="flex-shrink-0">{p.projects.length} projects</div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.skills.length} skills:</span>
                            {p.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] text-gray-600 font-medium">
                                {s.name}
                              </span>
                            ))}
                            {p.skills.length > 3 && <span className="text-[10px] text-gray-400">+{p.skills.length - 3} more</span>}
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
                        className="w-full sm:w-auto rounded-xl px-12 py-4 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 transition-all font-bold focus-ring shadow-soft flex items-center justify-center gap-3"
                      >
                        {loadingB ? "Ingesting..." : `Ingest ${validatedCsvProfiles.length} candidates`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {ingestResultB && (
                <div className="p-5 rounded-xl bg-green-50 border border-green-100 space-y-4 animate-fade-in-up shadow-sm">
                  <div className="flex items-center gap-3 text-green-800">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold">Successfully ingested {validatedCsvProfiles.length} candidates from CSV.</span>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#1F2A37] px-5 py-2.5 rounded-lg hover:bg-[#152030] transition-colors shadow-sm focus-ring"
                  >
                    Go to screening
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </div>
              )}

              {ingestErrorB && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600">
                  {ingestErrorB}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">3) Upload resume PDF (optional)</div>
                  <div className="text-xs text-gray-500">
                    Attach a PDF to an existing applicant for detailed AI parsing.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <label className="block space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Target applicant</div>
                    <select
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus-ring transition-card"
                      value={selectedApplicantId}
                      onChange={(e) => setSelectedApplicantId(e.target.value)}
                    >
                      <option value="">Choose an applicant...</option>
                      {(applicantsState ?? []).map((a: any) => (
                        <option key={a.id} value={a.id}>{a.fullName ?? a.id}</option>
                      ))}
                    </select>
                  </label>

                  <div
                    className={`rounded-2xl border-2 border-dashed transition-card p-10 text-center cursor-pointer min-h-[140px] flex items-center justify-center ${pdfFile ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) setPdfFile(f);
                    }}
                    onClick={() => document.getElementById("pdf-input")?.click()}
                  >
                    <input
                      id="pdf-input"
                      className="hidden"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPdfFile(f);
                      }}
                    />
                    <div className="text-sm font-medium text-gray-700">
                      {pdfFile ? (
                        <span>Selected: <span className="text-blue-700 font-bold">{pdfFile.name}</span></span>
                      ) : (
                        <span>Drop resume PDF here or <span className="text-blue-600 underline text-sm">browse</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <button
                    type="button"
                    disabled={!pdfFile || !selectedApplicantId}
                    onClick={() => void submitResumeUpload()}
                    className="rounded-xl px-8 py-4 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 transition-card font-medium"
                  >
                    Upload and parse PDF
                  </button>
                  {uploadStatus ? <div className="text-xs font-semibold text-blue-700 sm:px-2">{uploadStatus}</div> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
