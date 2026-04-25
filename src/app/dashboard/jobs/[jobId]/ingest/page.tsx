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

  // ✅ FIX: added missing field
  yearsExperience: string;

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
        result.push(l.substring(startValueIndex, i).trim().replace(/^"|"$/g, ""));
        startValueIndex = i + 1;
      }
    }

    result.push(l.substring(startValueIndex).trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

// Custom Select
const MapperSelect = ({
  value,
  onChange,
  options,
  label,
  hint
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label?: string;
  hint?: string;
}) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-[12px] font-medium text-[#5A6474]">{label}</label>}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-[13px]"
    >
      <option value="">(Skip field)</option>
      {options.map(h => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
    {hint && <p className="text-[11px] text-[#9BA5B4]">{hint}</p>}
  </div>
);

export default function IngestPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as string;
  const dispatch = useAppDispatch();
  const applicantsState = useAppSelector((s) => s.dashboard.applicants);

  const [tab, setTab] = useState<TabKey>("manual");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);

  const [mapping, setMapping] = useState<CSVMapping>({
    fullName: "",
    email: "",
    resumeUrl: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",

    // ✅ FIX
    yearsExperience: "",

    skills: [{ name: "", level: "", years: "" }],
    experience: [{ company: "", role: "", start: "", end: "", tech: "", desc: "" }],
    education: [{ institution: "", degree: "", field: "", start: "", end: "" }],
    projects: [{ name: "", role: "", tech: "", desc: "", start: "", end: "" }],

    availabilityStatus: "",
    availabilityType: "",
    linkedin: "",
    github: "",
    portfolio: ""
  });

  const onCsvSelected = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    const rows = parseCsvContent(text);

    setCsvRows(rows);

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      setCsvHeaders(headers);
    }
  };

  const submitCsvIngestion = async () => {
    if (!jobId || !csvFile) return;

    await dispatch(thunkIngestCsv({ jobId, csvFile, mapping }) as any);
    void dispatch(thunkFetchApplicants(jobId) as any);
  };

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold">Ingest Candidates</h1>

      {/* CSV Upload */}
      <input
        type="file"
        accept=".csv"
        onChange={e => e.target.files?.[0] && onCsvSelected(e.target.files[0])}
      />

      {csvHeaders.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <MapperSelect
            label="FULL NAME"
            value={mapping.fullName}
            onChange={v => setMapping({ ...mapping, fullName: v })}
            options={csvHeaders}
          />

          <MapperSelect
            label="EMAIL"
            value={mapping.email}
            onChange={v => setMapping({ ...mapping, email: v })}
            options={csvHeaders}
          />

          <MapperSelect
            label="YEARS EXPERIENCE"
            value={mapping.yearsExperience}
            onChange={v => setMapping({ ...mapping, yearsExperience: v })}
            options={csvHeaders}
          />
        </div>
      )}

      <button
        onClick={submitCsvIngestion}
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Submit
      </button>
    </div>
  );
}