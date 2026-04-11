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

  const scaledFloats = others.map((k) => ({ k, v: (current[k] / sumOthers) * remaining }));
  const scaledInts = scaledFloats.map((x) => ({ k: x.k, v: Math.floor(x.v) }));
  let drift = remaining - scaledInts.reduce((acc, x) => acc + x.v, 0);

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
    <div className="max-w-3xl mx-auto">
      <section className="space-y-8 animate-fade-in-up">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-neutral-800">Create a job</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Define must-have skills, experience and education requirements, and recruiter-adjustable scoring weights.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 space-y-10 shadow-card transition-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <label className="block space-y-1.5">
              <div className="text-[13px] font-medium text-neutral-700">Job title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-[14px] text-neutral-800 bg-white placeholder:text-neutral-400 focus-ring transition-card"
                placeholder="e.g., Backend Engineer"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <div className="text-[13px] font-medium text-neutral-700">Experience level (years)</div>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-[14px] text-neutral-800 bg-white focus-ring transition-card"
                required
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <div className="text-[13px] font-medium text-neutral-700">Job description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-[14px] text-neutral-800 bg-white min-h-[140px] focus-ring transition-card"
              required
            />
          </label>

          <div className="space-y-4">
            <div className="text-[13px] font-medium text-neutral-700">Required skills (tags)</div>
            <div className="flex flex-wrap gap-2">
              {skills.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-[12px] font-medium text-primary-700 transition-card hover:scale-[1.02]">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setSkills((prev) => prev.filter((x) => x !== tag))}
                    className="text-primary-400 hover:text-danger focus:outline-none"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkillTag();
                  }
                }}
                className="flex-1 rounded-lg border border-neutral-300 px-3.5 py-2.5 text-[14px] text-neutral-800 bg-white placeholder:text-neutral-400 focus-ring transition-card"
                placeholder="Type a skill and press Enter"
              />
              <button 
                type="button" 
                onClick={addSkillTag} 
                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Add skill
              </button>
            </div>
          </div>

          <label className="block space-y-1.5">
            <div className="text-[13px] font-medium text-neutral-700">Education requirement</div>
            <input
              value={educationRequirement}
              onChange={(e) => setEducationRequirement(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-[14px] text-neutral-800 bg-white focus-ring transition-card"
              required
            />
          </label>

          <div className="space-y-8 pt-6 border-t border-neutral-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium text-neutral-700 uppercase tracking-wider">Custom scoring weights</div>
                <div className="text-[12px] text-neutral-500 mt-1">Adjust based on your priority. Sliders must sum to 100%.</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ${sumWeights(weights) === 100 ? "bg-successLight text-success border border-success/20" : "bg-dangerLight text-danger border border-danger/20"}`}>
                <span className="opacity-70">Sum:</span>
                <span>{sumWeights(weights)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {(
                [
                  { key: "skills", label: "Skills", hint: "Concrete technical match" },
                  { key: "experience", label: "Experience", hint: "Depth of track record" },
                  { key: "education", label: "Education", hint: "Formal education signals" },
                  { key: "relevance", label: "Relevance", hint: "Overall role fit" }
                ] as Array<{ key: WeightKey; label: string; hint: string }>
              ).map((w) => (
                <div key={w.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] text-neutral-600">
                      {w.label} <span className="text-[11px] text-neutral-400 font-normal ml-1">— {w.hint}</span>
                    </div>
                    <div className="text-[13px] text-primary-500 font-semibold">{weights[w.key]}%</div>
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
                    className="w-full h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-500 focus-ring"
                  />
                </div>
              ))}
            </div>
          </div>

          {jobCreate.error ? (
            <div className="p-4 rounded-lg bg-dangerLight text-sm text-danger border border-danger/20">
              {jobCreate.error}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-6">
            <button
              type="submit"
              disabled={!canSubmit || jobCreate.loading}
              className="px-10 py-3.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
            >
              {jobCreate.loading ? "Creating..." : "Save job and continue"}
            </button>
            <div className="text-[12px] text-neutral-400 italic leading-relaxed max-w-xs">
              Recruiter always keeps the final word. AI handles the heavy lifting, you handle the selection.
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
