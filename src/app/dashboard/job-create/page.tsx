"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkCreateJob } from "@/store/slices/dashboardSlice";

type WeightKey = "skills" | "experience" | "education" | "relevance";

function sumWeights(w: Record<WeightKey, number>) {
  return w.skills + w.experience + w.education + w.relevance;
}

function adjustWeights(current: Record<WeightKey, number>, changedKey: WeightKey, nextValue: number) {
  // Keep sum=100 by scaling the other three weights proportionally.
  const clamped = Math.max(0, Math.min(100, Math.round(nextValue)));
  const others: WeightKey[] = (["skills", "experience", "education", "relevance"] as WeightKey[]).filter((k) => k !== changedKey);

  const remaining = 100 - clamped;
  const sumOthers = others.reduce((acc, k) => acc + current[k], 0);
  if (sumOthers <= 0) {
    const base = Math.floor(remaining / others.length);
    const rem = remaining - base * others.length;
    const out = { ...current, [changedKey]: clamped } as Record<WeightKey, number>;
    others.forEach((k, idx) => {
      out[k] = base + (idx === 0 ? rem : 0);
    });
    return out;
  }

  // Scale and then fix rounding drift.
  const scaledFloats = others.map((k) => ({ k, v: (current[k] / sumOthers) * remaining }));
  const scaledInts = scaledFloats.map((x) => ({ k: x.k, v: Math.floor(x.v) }));
  let drift = remaining - scaledInts.reduce((acc, x) => acc + x.v, 0);

  // Distribute drift to candidates with largest fractional parts.
  scaledFloats.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  const out = { ...current, [changedKey]: clamped } as Record<WeightKey, number>;
  for (const x of scaledInts) out[x.k] = x.v;
  let i = 0;
  while (drift > 0) {
    const k = scaledFloats[i % scaledFloats.length].k;
    out[k] += 1;
    drift -= 1;
    i += 1;
  }
  return out;
}

export default function JobCreatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobCreate = useAppSelector((s) => s.dashboard.jobCreate);

  const [title, setTitle] = useState("Senior Backend Engineer");
  const [description, setDescription] = useState(
    "Build and maintain backend services for HR workflows, focusing on reliability, security, and clear APIs."
  );
  const [skills, setSkills] = useState<string[]>(["Node.js", "TypeScript", "REST API", "MongoDB"]);
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [educationRequirement, setEducationRequirement] = useState("BSc in Computer Science or equivalent");

  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    skills: 35,
    experience: 30,
    education: 15,
    relevance: 20
  });

  const topNDefault = 10;

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && description.trim().length > 0 && skills.length > 0 && sumWeights(weights) === 100;
  }, [title, description, skills.length, weights]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      requirements: {
        mustHave: skills,
        yearsExperienceMin: Math.max(0, Math.round(experienceYears)),
        education: [educationRequirement.trim()],
        niceToHave: [],
        keywords: []
      },
      scoringWeights: {
        skills: weights.skills,
        experience: weights.experience,
        education: weights.education,
        relevance: weights.relevance
      },
      screeningConfig: { defaultTopN: topNDefault, maxCandidatesPerRun: 200, language: "en" }
    };

    const action = await dispatch(thunkCreateJob(payload) as any);
    if (thunkCreateJob.fulfilled.match(action)) {
      const jobId = action.payload.id;
      router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}/ingest`);
      return;
    }
  }

  function addSkillTag() {
    const raw = skillsInput.trim();
    if (!raw) return;
    const normalized = raw.replace(/\s+/g, " ");
    if (skills.some((s) => s.toLowerCase() === normalized.toLowerCase())) return;
    setSkills((prev) => [...prev, normalized].slice(0, 20));
    setSkillsInput("");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create a job</h1>
        <p className="mt-1 text-sm text-gray-600">
          Define must-have skills, experience and education requirements, and recruiter-adjustable scoring weights.
        </p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm font-medium text-gray-900">Job title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
              placeholder="e.g., Backend Engineer"
              required
            />
          </label>
          <label className="block">
            <div className="text-sm font-medium text-gray-900">Experience level (years)</div>
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
              required
            />
          </label>
        </div>

        <label className="block">
          <div className="text-sm font-medium text-gray-900">Job description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 bg-white min-h-[120px]"
            required
          />
        </label>

        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">Required skills (tags)</div>
          <div className="flex flex-wrap gap-2">
            {skills.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-sm text-gray-800">
                {tag}
                <button
                  type="button"
                  onClick={() => setSkills((prev) => prev.filter((x) => x !== tag))}
                  className="text-gray-500 hover:text-gray-800"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkillTag();
                }
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
              placeholder="Type a skill and press Enter"
            />
            <button type="button" onClick={addSkillTag} className="rounded-xl px-4 py-2 bg-[#1F2A37] text-white hover:bg-[#152030]">
              Add
            </button>
          </div>
        </div>

        <label className="block">
          <div className="text-sm font-medium text-gray-900">Education requirement</div>
          <input
            value={educationRequirement}
            onChange={(e) => setEducationRequirement(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 bg-white"
            required
          />
        </label>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Custom scoring weights</div>
              <div className="text-xs text-gray-600 mt-1">Sliders always sum to 100.</div>
            </div>
            <div className="text-sm text-gray-900">
              Sum: <span className="font-semibold">{sumWeights(weights)}</span>
            </div>
          </div>

          {(
            [
              { key: "skills", label: "Skills", hint: "Concrete technical match" },
              { key: "experience", label: "Experience", hint: "Depth of relevant track record" },
              { key: "education", label: "Education", hint: "Formal education signals" },
              { key: "relevance", label: "Relevance", hint: "Overall role fit" }
            ] as Array<{ key: WeightKey; label: string; hint: string }>
          ).map((w) => (
            <div key={w.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">
                  {w.label} <span className="text-xs font-normal text-gray-600">({w.hint})</span>
                </div>
                <div className="text-sm text-gray-900 font-semibold">{weights[w.key]}%</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[w.key]}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setWeights((cur) => adjustWeights(cur, w.key, next));
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {jobCreate.error ? <div className="text-sm text-red-600">{jobCreate.error}</div> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || jobCreate.loading}
            className="rounded-xl px-5 py-3 bg-[#1F2A37] text-white hover:bg-[#152030] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {jobCreate.loading ? "Creating..." : "Save job and continue"}
          </button>
          <div className="text-xs text-gray-600">
            Tip: recruiter can adjust weights per job; AI never makes final hiring decisions.
          </div>
        </div>
      </form>
    </section>
  );
}

