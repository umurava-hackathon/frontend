"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkCreateJob } from "@/store/slices/dashboardSlice";
import { JDGenerator } from "@/components/reports/JDGenerator";

export default function JobCreatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, createdJobId } = useAppSelector((s) => s.dashboard.jobCreate);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Node.js", "MongoDB"]);
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [educationRequirement, setEducationRequirement] = useState("BSc in Computer Science or equivalent");

  const [weights, setWeights] = useState({
    skills: 40,
    experience: 30,
    education: 15,
    relevance: 15
  });

  useEffect(() => {
    if (createdJobId) {
      router.push(`/dashboard/jobs/${createdJobId}/ingest`);
    }
  }, [createdJobId, router]);

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillsInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillsInput.trim())) {
        setSkills([...skills, skillsInput.trim()]);
      }
      setSkillsInput("");
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((item) => item !== s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void dispatch(thunkCreateJob({
      title,
      description,
      department,
      location,
      employmentType,
      requirements: {
        mustHave: skills,
        yearsExperienceMin: experienceYears,
        education: [educationRequirement]
      },
      scoringWeights: weights,
      screeningConfig: { defaultTopN: 10, maxCandidatesPerRun: 100 }
    }) as any);
  };

  const weightSum = weights.skills + weights.experience + weights.education + weights.relevance;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#0F1621]">Create Recruitment Campaign</h1>
        <p className="text-sm text-[#5A6474]">Set up your job requirements and AI scoring weights to begin screening.</p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="bg-white border border-[#E8EAED] rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest mb-2">
            <span className="h-4 w-1 bg-[#2B71F0] rounded-full" />
            Basic Information
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#5A6474]">Job Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Fullstack Engineer"
                className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#5A6474]">Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#5A6474]">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / Kigali"
                  className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#5A6474]">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#5A6474]">Job Description</label>
                <JDGenerator onSelect={(desc) => setDescription(desc)} />
              </div>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline the core responsibilities and expectations..."
                className="w-full min-h-[160px] rounded-lg border border-[#E8EAED] bg-white px-4 py-3 text-sm focus-ring transition-all leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white border border-[#E8EAED] rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest mb-2">
            <span className="h-4 w-1 bg-[#2B71F0] rounded-full" />
            Candidate Requirements
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[13px] font-semibold text-[#5A6474]">Core Skills (Press Enter to add)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF4FF] text-[#2B71F0] text-[12px] font-bold border border-[#EEF4FF]">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-[#1A5CE0]">&times;</button>
                  </span>
                ))}
              </div>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={addSkill}
                placeholder="Type a skill and hit enter..."
                className="w-full rounded-lg border border-[#E8EAED] bg-[#F8F9FC] px-4 py-2.5 text-sm focus-ring transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#5A6474]">Minimum Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#5A6474]">Education Requirement</label>
                <input
                  value={educationRequirement}
                  onChange={(e) => setEducationRequirement(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Weights */}
        <div className="bg-white border border-[#E8EAED] rounded-xl p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#9BA5B4] uppercase tracking-widest">
              <span className="h-4 w-1 bg-[#2B71F0] rounded-full" />
              AI Scoring Weights
            </div>
            <div className={`text-[11px] font-bold px-3 py-1 rounded-full border ${weightSum === 100 ? "bg-[#F0FDF4] text-[#10B981] border-[#10B981]" : "bg-red-50 text-red-600 border-red-100"}`}>
              Total: {weightSum}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(["skills", "experience", "education", "relevance"] as const).map((w) => (
              <div key={w} className="space-y-2">
                <label className="text-[12px] font-bold text-[#5A6474] capitalize">{w}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weights[w]}
                    onChange={(e) => setWeights({ ...weights, [w]: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm font-bold text-[#0F1621] focus-ring transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9BA5B4]">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 text-sm font-bold text-[#5A6474] hover:text-[#0F1621] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || weightSum !== 100}
            className="bg-[#2B71F0] hover:bg-[#1A5CE0] text-white px-10 py-3 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? "Creating Campaign..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
