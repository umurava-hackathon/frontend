"use client";

import React, { useState } from "react";
import { apiGenerateJobDescription } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

interface JDGeneratorProps {
  onSelect: (description: string) => void;
  onSkillsExtracted?: (skills: string[]) => void;
}

export function JDGenerator({ onSelect, onSkillsExtracted }: JDGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult("");
    setExtractedSkills([]);
    try {
      const response = await apiGenerateJobDescription(prompt);
      setResult(response.description);
      if (response.skills) setExtractedSkills(response.skills);
    } catch (error) {
      setResult("AI engine is currently busy. Please try again in a few moments.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  const handleUse = () => {
    onSelect(result);
    if (onSkillsExtracted && extractedSkills.length > 0) {
      onSkillsExtracted(extractedSkills);
    }
    setIsOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -20, opacity: 0, x: "-50%" }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-0 left-1/2 bg-[#0F1621] text-white px-6 py-3 rounded-2xl text-[14px] font-black z-[100] shadow-2xl"
          >
            Job description applied successfully ✓
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#BBCFFF] bg-white text-[#2B71F0] text-[13px] font-black uppercase tracking-wider hover:bg-[#F0F7FF] transition-all shadow-sm active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        Generate with AI
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10">
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => !isGenerating && setIsOpen(false)}
               className="absolute inset-0 bg-[#0F1621]/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[900px] bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-full"
            >
              <div className="bg-[#2B71F0] p-8 sm:p-10 flex items-center justify-between shrink-0 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-inner">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-white text-[24px] font-black tracking-tight leading-none">AI Content Engine</h2>
                    <p className="text-white/60 text-[12px] font-bold uppercase tracking-[0.2em] mt-2">Architecture & Technical Writing</p>
                  </div>
                </div>
                <button 
                  disabled={isGenerating}
                  onClick={() => setIsOpen(false)} 
                  className="relative z-10 h-12 w-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-2xl transition-all disabled:opacity-0"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[12px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Contextual Brief</span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the role: e.g. Senior Product Designer, 5+ years experience, specialized in Design Systems, remote-first role for a growing Fintech platform..."
                    className="w-full min-h-[140px] bg-[#F8F9FB] border-2 border-[#E8EAED] rounded-[28px] p-6 text-[16px] text-[#0F1621] font-medium outline-none focus:border-[#2B71F0] focus:bg-white transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  disabled={!prompt.trim() || isGenerating}
                  onClick={handleGenerate}
                  className="w-full h-16 bg-[#2B71F0] text-white rounded-[24px] text-[15px] font-black uppercase tracking-[0.15em] shadow-2xl shadow-blue-500/30 hover:bg-[#1A5CE0] hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <>
                      <span>Synthesizing</span>
                      <div className="flex gap-1.5">
                         {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-white rounded-full" />)}
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                      Generate Professional JD
                    </>
                  )}
                </button>

                {isGenerating && (
                  <div className="space-y-4 px-2">
                    {[100, 85, 95, 60, 40].map((w, i) => (
                      <div key={i} className="h-3 bg-[#F8F9FC] border border-[#E8EAED] rounded-full relative overflow-hidden" style={{ width: `${w}%` }}>
                         <motion.div 
                           animate={{ x: ["-100%", "100%"] }}
                           transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2B71F0]/20 to-transparent"
                         />
                      </div>
                    ))}
                  </div>
                )}

                {result && !isGenerating && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="relative group">
                       <div className="absolute -left-6 top-0 bottom-0 w-1 bg-[#2B71F0]/20 rounded-full" />
                       <div className="bg-[#F8F9FC] border-2 border-[#DDE7FF] rounded-[32px] p-8 max-h-[500px] overflow-y-auto text-[16px] text-[#0F1621] font-medium leading-relaxed whitespace-pre-wrap italic shadow-inner custom-scrollbar">
                          {result}
                       </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-4">
                      <button
                        type="button"
                        onClick={handleUse}
                        className="flex-1 bg-[#2B71F0] text-white rounded-[20px] py-5 text-[15px] font-black uppercase tracking-wider hover:bg-[#1A5CE0] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                        Apply to Campaign
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-10 border-2 border-[#BBCFFF] bg-white text-[#2B71F0] rounded-[20px] py-5 text-[15px] font-black uppercase tracking-wider hover:bg-[#F0F7FF] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                         {copyStatus === "copied" ? "Copied" : "Copy text"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
