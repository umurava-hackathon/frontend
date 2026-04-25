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
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [educationRequirement, setEducationRequirement] = useState("");

  const handleSkillsExtracted = (extracted: string[]) => {
    // Merge new skills without duplicates
    setSkills(prev => Array.from(new Set([...prev, ...extracted])));
  };

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
        education: educationRequirement ? [educationRequirement] : []
      },
      scoringWeights: weights,
      screeningConfig: { defaultTopN: 10, maxCandidatesPerRun: 100 }
    }) as any);
  };

  const weightSum = weights.skills + weights.experience + weights.education + weights.relevance;

  return (
    <div className="max-w-[1000px] mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#0F1621] tracking-tight leading-none">New Recruitment Campaign</h1>
          <p className="text-[16px] text-[#5A6474] font-medium max-w-xl">Define your ideal candidate profile and let AI handle the heavy lifting.</p>
        </div>
      </div>

      <form className="space-y-10" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="relative bg-white border border-[#E8EAED] rounded-[32px] p-10 shadow-sm space-y-10 overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full h-[30%] bg-[#2B71F0]" />
          
          <div className="space-y-8 pl-4">
            <div className="space-y-2.5">
              <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Campaign Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Fullstack Architect"
                className="w-full rounded-2xl border-2 border-[#E8EAED] bg-white px-6 py-4 text-[16px] font-bold text-[#0F1621] focus-ring transition-all placeholder:text-[#9BA5B4]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2.5">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering"
                  className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 text-[14px] font-bold text-[#0F1621] focus-ring transition-all"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote / Kigali"
                  className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 text-[14px] font-bold text-[#0F1621] focus-ring transition-all"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Contract</label>
                <div className="relative group">
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 text-[14px] font-black text-[#0F1621] focus-ring transition-all appearance-none cursor-pointer"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-colors">
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1 px-1">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Job Description</label>
                <div className="text-[11px] text-[#9BA5B4] font-bold uppercase tracking-widest italic opacity-70">Define the core mission and scope of this role</div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                   <JDGenerator 
                     onSelect={(desc) => setDescription(desc)} 
                     onSkillsExtracted={handleSkillsExtracted}
                   />
                </div>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline core responsibilities, culture, and project expectations..."
                  className="w-full min-h-[220px] rounded-2xl border border-[#E8EAED] bg-white px-6 py-5 text-[15px] focus-ring transition-all leading-relaxed font-medium shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="relative bg-white border border-[#E8EAED] rounded-[32px] p-10 shadow-sm space-y-10 overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full h-[30%] bg-[#2B71F0]" />

          <div className="space-y-8 pl-4">
            <div className="space-y-4">
              <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Core Required Skills</label>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 mb-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F8FF] text-[#2B71F0] text-[13px] font-black border border-[#EEF4FF] animate-in zoom-in-95 duration-200">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="text-[#9BA5B4] hover:text-[#DC2626] transition-colors"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E8EAED] text-center mb-2">
                   <p className="text-[12px] text-[#9BA5B4] font-bold uppercase tracking-widest">No skills added yet. Use AI or type below.</p>
                </div>
              )}
              <div className="relative group max-w-md">
                 <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9BA5B4] group-focus-within:text-[#2B71F0] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                 <input
                   value={skillsInput}
                   onChange={(e) => setSkillsInput(e.target.value)}
                   onKeyDown={addSkill}
                   placeholder="Type skill and press Enter..."
                   className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] pl-11 pr-5 py-3 text-[14px] font-bold text-[#0F1621] focus-ring transition-all"
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
              <div className="space-y-2.5">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Min. Years Experience</label>
                <div className="relative w-48">
                   <input
                     type="number"
                     value={experienceYears}
                     onChange={(e) => setExperienceYears(Number(e.target.value))}
                     className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 text-[15px] font-black text-[#0F1621] focus-ring transition-all"
                   />
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Academic Level</label>
                <input
                  value={educationRequirement}
                  onChange={(e) => setEducationRequirement(e.target.value)}
                  className="w-full rounded-xl border border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 text-[14px] font-bold text-[#0F1621] focus-ring transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Weights */}
        <div className="relative bg-white border border-[#E8EAED] rounded-[32px] p-10 shadow-sm space-y-10 overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full h-[30%] bg-[#2B71F0]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-4 border-b border-[#F5F6FA] pb-6">
            <div className="space-y-1">
               <h3 className="text-[13px] font-black text-[#0F1621] uppercase tracking-[0.2em]">AI Intelligence Tuning</h3>
               <p className="text-[12px] text-[#9BA5B4] font-bold uppercase tracking-widest">Adjust weight distribution for this specific role</p>
            </div>
            <div className={`px-5 py-2 rounded-2xl text-[13px] font-black border-2 transition-all ${weightSum === 100 ? "bg-[#F0FDF4] text-[#10B981] border-[#10B981]/20 shadow-lg shadow-emerald-500/10" : "bg-red-50 text-red-600 border-red-100 animate-pulse"}`}>
              Configuration: {weightSum}%
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pl-4">
            {(["skills", "experience", "education", "relevance"] as const).map((w) => (
              <div key={w} className="space-y-3">
                <label className="text-[11px] font-black text-[#5A6474] uppercase tracking-[0.15em] ml-1">{w}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weights[w]}
                    onChange={(e) => setWeights({ ...weights, [w]: Number(e.target.value) })}
                    className="w-full rounded-2xl border-2 border-[#E8EAED] bg-white px-5 py-3.5 text-[18px] font-black text-[#0F1621] focus:border-[#2B71F0] outline-none transition-all shadow-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-[#9BA5B4]">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-6 rounded-[24px] bg-red-50 border border-red-100 text-red-600 text-[14px] font-black uppercase tracking-widest text-center shadow-sm animate-shake">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-6 px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-10 py-4 text-[14px] font-black text-[#9BA5B4] uppercase tracking-[0.15em] hover:text-[#0F1621] transition-all"
          >
            Cancel Session
          </button>
          <button
            type="submit"
            disabled={loading || weightSum !== 100}
            className="w-full sm:w-auto bg-[#2B71F0] text-white px-14 py-4 rounded-[20px] font-black text-[15px] uppercase tracking-[0.1em] shadow-2xl shadow-blue-500/30 hover:bg-[#1A5CE0] hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 active:scale-95"
          >
            {loading ? "Initializing..." : "Launch Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
