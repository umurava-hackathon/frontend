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

const candidateFields = [
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "resumeUrl", label: "Resume URL (optional)" },
  { key: "skills", label: "Skills" },
  { key: "yearsExperience", label: "Years experience" },
  { key: "education", label: "Education" },
  { key: "headline", label: "Headline" },
  { key: "summary", label: "Summary" }
] as const;

type MappingKey = (typeof candidateFields)[number]["key"];

function safeJsonParse(s: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON" };
  }
}

function parseCsvHeader(csvText: string): string[] {
  const firstLine = csvText.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return [];
  // Simple header split; assumes commas separate headers without complex quoting.
  return firstLine.split(",").map((h) => h.trim()).filter(Boolean);
}

export default function IngestPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const dispatch = useAppDispatch();
  const applicantsState = useAppSelector((s) => s.dashboard.applicants);
  const [tab, setTab] = useState<TabKey>("umurava");

  // Screen 2A: Umurava profiles
  const [profilesJson, setProfilesJson] = useState<string>(
    JSON.stringify(
      [
        {
          schemaVersion: "umurava-v1",
          fullName: "Marie Uwimana",
          email: "marie.uwimana@example.com",
          phone: "+250788111222",
          location: "Kigali",
          headline: "Node.js Engineer",
          summary: "Builds backend services and APIs with TypeScript and MongoDB.",
          skills: ["Node.js", "TypeScript", "REST API", "MongoDB"],
          yearsExperience: 4,
          education: [
            { level: "BSc", field: "Computer Science", school: "University of Kigali", start_year: 2016, end_year: 2020 }
          ],
          workHistory: [{ company: "FinTechWorks", title: "Backend Engineer", start: "2021-01", end: "2024-03", highlights: ["Designed REST APIs", "Improved DB performance"] }],
          certifications: ["MongoDB Associate"],
          languages: ["English"]
        }
      ],
      null,
      2
    )
  );
  const [ingestResultA, setIngestResultA] = useState<any | null>(null);
  const [ingestErrorA, setIngestErrorA] = useState<string | null>(null);
  const [loadingA, setLoadingA] = useState(false);

  // Screen 2B: External CSV + PDF
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<MappingKey, string>>>({
    fullName: "fullName",
    email: "email",
    phone: "phone",
    location: "location",
    resumeUrl: "resumeUrl",
    skills: "skills",
    yearsExperience: "yearsExperience",
    education: "education",
    headline: "headline",
    summary: "summary"
  });
  const [ingestResultB, setIngestResultB] = useState<any | null>(null);
  const [ingestErrorB, setIngestErrorB] = useState<string | null>(null);
  const [loadingB, setLoadingB] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    void dispatch(thunkFetchApplicants(jobId) as any);
  }, [jobId, dispatch]);

  useEffect(() => {
    if (!jobId) return;
    // When applicants load, default the resume target.
    if (Array.isArray(applicantsState) && applicantsState.length > 0 && !selectedApplicantId) {
      const first = applicantsState.find((a: any) => a.ingestionStatus === "ready") ?? applicantsState[0];
      if (first?.id) setSelectedApplicantId(first.id);
    }
  }, [applicantsState, selectedApplicantId, jobId]);

  async function onCsvSelected(file: File) {
    setCsvFile(file);
    setIngestResultB(null);
    setIngestErrorB(null);
    const text = await file.text();
    const headers = parseCsvHeader(text);
    setCsvHeaders(headers);

    if (headers.length > 0) {
      // Auto-suggest mapping based on common column names.
      setMapping((cur) => {
        const next = { ...cur };
        const pick = (key: MappingKey, candidates: string[]) => {
          const found = candidates.find((c) => headers.some((h) => h.toLowerCase() === c.toLowerCase()));
          if (found) next[key] = found;
        };
        pick("fullName", ["fullName", "name", "full_name", "Full Name"]);
        pick("email", ["email", "Email"]);
        pick("phone", ["phone", "Phone"]);
        pick("location", ["location", "Location"]);
        pick("resumeUrl", ["resumeUrl", "Resume URL", "resume"]);
        pick("skills", ["skills", "Skills"]);
        pick("yearsExperience", ["yearsExperience", "experienceYears", "Years", "years"]);
        pick("education", ["education", "Education"]);
        pick("headline", ["headline", "Headline"]);
        pick("summary", ["summary", "Summary", "about"]);
        return next;
      });
    }
  }

  async function submitUmuravaProfiles() {
    if (!jobId) return;
    setLoadingA(true);
    setIngestErrorA(null);
    setIngestResultA(null);
    try {
      const parsed = safeJsonParse(profilesJson);
      if (!parsed.ok) throw new Error(parsed.error);

      const v = parsed.value;
      const profiles = Array.isArray(v) ? v : Array.isArray(v?.profiles) ? v.profiles : null;
      if (!profiles) throw new Error("Expected an array of profiles or { profiles: [...] }");

      const resAction = await dispatch(thunkIngestUmuravaProfiles({ jobId, profiles }) as any);
      if (thunkIngestUmuravaProfiles.fulfilled.match(resAction)) {
        setIngestResultA(resAction.payload.data ?? resAction.payload);
        // Refresh applicants so recruiters can proceed.
        void dispatch(thunkFetchApplicants(jobId) as any);
      }
    } catch (err: any) {
      setIngestErrorA(err?.message ?? "Ingestion failed");
    } finally {
      setLoadingA(false);
    }
  }

  async function submitCsvIngestion() {
    if (!jobId || !csvFile) return;
    setLoadingB(true);
    setIngestErrorB(null);
    setIngestResultB(null);

    try {
      const mappingObj = Object.fromEntries(
        (Object.entries(mapping) as Array<[MappingKey, string]>).filter(([, v]) => !!v)
      ) as any;

      const resAction = await dispatch(thunkIngestCsv({ jobId, csvFile, mapping: mappingObj }) as any);
      if (thunkIngestCsv.fulfilled.match(resAction)) {
        setIngestResultB(resAction.payload.data ?? resAction.payload);
        void dispatch(thunkFetchApplicants(jobId) as any);
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
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Applicants ingestion</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add candidates from structured Umurava profiles or from external sources (CSV + resume PDF).
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/screen`)}
          className="rounded-xl px-4 py-2 bg-[#1F2A37] text-white hover:bg-[#152030]"
        >
          Continue to screening
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm border ${tab === "umurava" ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-white text-gray-700 border-gray-200"}`}
            onClick={() => setTab("umurava")}
          >
            Umurava profiles
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm border ${tab === "external" ? "bg-[#1F2A37] text-white border-[#1F2A37]" : "bg-white text-gray-700 border-gray-200"}`}
            onClick={() => setTab("external")}
          >
            External (CSV + PDF)
          </button>
        </div>

        <div className="mt-5">
          {tab === "umurava" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">Paste profiles JSON</div>
                <div className="text-xs text-gray-600">
                  Provide either an array of profiles or an object like <span className="font-mono">{"{ profiles: [...] }"}</span>. Each profile must be <span className="font-mono">umurava-v1</span>.
                </div>
              </div>
              <textarea
                value={profilesJson}
                onChange={(e) => setProfilesJson(e.target.value)}
                className="w-full min-h-[260px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              {ingestErrorA ? <div className="text-sm text-red-600">{ingestErrorA}</div> : null}
              {ingestResultA ? (
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 text-sm">
                  <div className="font-semibold text-gray-900">Ingestion summary</div>
                  <div className="mt-1 text-gray-700">
                    Created: <span className="font-semibold">{ingestResultA.createdApplicantIds?.length ?? 0}</span>
                  </div>
                  <div className="mt-1 text-gray-700">
                    Rejected: <span className="font-semibold">{ingestResultA.rejected?.length ?? 0}</span>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                disabled={loadingA}
                onClick={() => void submitUmuravaProfiles()}
                className="rounded-xl px-5 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50"
              >
                {loadingA ? "Validating and ingesting..." : "Ingest profiles"}
              </button>

              <div className="text-xs text-gray-500">
                Recruiters keep control: AI explains strengths/gaps later during screening.
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">1) Upload CSV</div>
                <div className="text-xs text-gray-600">Drag-drop a CSV of candidates. We auto-read the header for mapping.</div>
                <div
                  className="rounded-2xl border border-dashed border-gray-300 bg-white p-5"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) void onCsvSelected(f);
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      {csvFile ? (
                        <span>
                          Selected: <span className="font-semibold">{csvFile.name}</span>
                        </span>
                      ) : (
                        <span>Drop CSV here, or choose a file below.</span>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-xl px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm">
                      Choose file
                      <input
                        className="hidden"
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void onCsvSelected(f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">2) Map CSV columns</div>
                    <div className="text-xs text-gray-600">Select which CSV column feeds each candidate field.</div>
                  </div>
                  <div className="text-xs text-gray-500">{csvHeaders.length ? `${csvHeaders.length} headers detected` : "Upload a CSV to see headers"}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidateFields.map((f) => (
                    <label key={f.key} className="block text-sm">
                      <div className="text-gray-900 font-medium">{f.label}</div>
                      <select
                        disabled={csvHeaders.length === 0}
                        value={(mapping as any)[f.key] ?? ""}
                        onChange={(e) => setMapping((cur) => ({ ...cur, [f.key]: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                      >
                        <option value="">(not provided)</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {ingestErrorB ? <div className="text-sm text-red-600">{ingestErrorB}</div> : null}
                {ingestResultB ? (
                  <div className="text-sm rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="font-semibold text-gray-900">CSV ingestion summary</div>
                    <div className="mt-1 text-gray-700">
                      Created: <span className="font-semibold">{ingestResultB.rowsCreated ?? 0}</span>
                    </div>
                    <div className="mt-1 text-gray-700">
                      Rejected: <span className="font-semibold">{ingestResultB.rowsRejected ?? 0}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={!csvFile || loadingB}
                  onClick={() => void submitCsvIngestion()}
                  className="rounded-xl px-5 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50"
                >
                  {loadingB ? "Ingesting CSV..." : "Ingest CSV"}
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">3) Upload a resume PDF (optional)</div>
                  <div className="text-xs text-gray-600">
                    Select the applicant to attach the PDF to, then upload. This populates extracted skills and education.
                  </div>
                </div>

                <label className="block text-sm">
                  <div className="text-gray-900 font-medium">Attach to applicant</div>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                    value={selectedApplicantId}
                    onChange={(e) => setSelectedApplicantId(e.target.value)}
                  >
                    <option value="">Choose applicant...</option>
                    {(applicantsState ?? []).map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName ?? a.id}
                      </option>
                    ))}
                  </select>
                </label>

                <div
                  className="rounded-2xl border border-dashed border-gray-300 bg-white p-5"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) setPdfFile(f);
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      {pdfFile ? <span>Selected: <span className="font-semibold">{pdfFile.name}</span></span> : <span>Drop PDF resume here.</span>}
                    </div>
                    <label className="cursor-pointer rounded-xl px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm">
                      Choose PDF
                      <input
                        className="hidden"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setPdfFile(f);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!pdfFile || !selectedApplicantId}
                  onClick={() => void submitResumeUpload()}
                  className="rounded-xl px-5 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50"
                >
                  Upload resume
                </button>
                {uploadStatus ? <div className="text-sm text-gray-700">{uploadStatus}</div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

