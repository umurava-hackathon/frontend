"use client";

import React, { useState } from "react";
import { apiGenerateJobDescription } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

interface JDGeneratorProps {
  onSelect: (description: string) => void;
}

export function JDGenerator({ onSelect }: JDGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult("");
    try {
      const response = await apiGenerateJobDescription(prompt);
      setResult(response.description);
    } catch (error) {
      setResult("Something went wrong, please try again.");
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
            className="fixed top-0 left-1/2 bg-[#0F1621] text-white px-4 py-2 rounded-lg text-[13px] font-jakarta z-[60] shadow-lg"
          >
            Description added ✓
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BBCFFF] bg-white text-[#2B71F0] text-[12px] font-medium font-jakarta hover:bg-[#EEF4FF] transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>
        Generate with AI
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#F5F6FA] border border-[#E8EAED] rounded-xl p-4 mt-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0F1621] font-jakarta flex items-center gap-2">
                   <span>✨</span> AI Job Description Generator
                </span>
                <button onClick={() => setIsOpen(false)} className="text-[#9BA5B4] hover:text-[#0F1621]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#5A6474] font-jakarta">Describe the role in a few words</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Senior backend engineer, Node.js and TypeScript, 5 years experience, fintech company, remote-friendly, must know MongoDB and REST APIs"
                  className="w-full min-height-[72px] bg-white border border-[#E8EAED] rounded-lg p-3 text-[13px] text-[#0F1621] font-jakarta focus:border-[#2B71F0] outline-none transition-all resize-y"
                />
              </div>

              <button
                type="button"
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
                className="w-full h-10 bg-[#2B71F0] text-white rounded-lg text-sm font-bold font-jakarta hover:bg-[#1A5CE0] disabled:bg-[#E8EAED] transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    Generating
                    <span className="flex gap-0.5">
                       {[0, 1, 2].map(i => <motion.span key={i} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}>.</motion.span>)}
                    </span>
                  </>
                ) : "Generate description"}
              </button>

              {isGenerating && (
                <div className="space-y-2 mt-4">
                  {[100, 85, 70].map((w, i) => (
                    <div key={i} className="h-3.5 bg-[#E8EAED] rounded relative overflow-hidden" style={{ width: `${w}%` }}>
                       <motion.div 
                         animate={{ x: ["-100%", "100%"] }}
                         transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                         className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                       />
                    </div>
                  ))}
                </div>
              )}

              {result && !isGenerating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 bg-white border border-[#E8EAED] rounded-lg overflow-hidden flex flex-col shadow-sm">
                   <div className="p-4 max-h-[280px] overflow-y-auto text-[13px] text-[#0F1621] font-jakarta leading-relaxed whitespace-pre-wrap scrollbar-thin">
                      {result}
                   </div>
                   <div className="p-3 border-t border-[#E8EAED] flex gap-2 shrink-0 bg-white">
                      <button
                        type="button"
                        onClick={handleUse}
                        className="flex-1 bg-[#2B71F0] text-white rounded-lg py-2 text-[13px] font-semibold font-jakarta hover:bg-[#1A5CE0] transition-all shadow-sm"
                      >
                        Use this description
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-4 border border-[#E8EAED] text-[#5A6474] rounded-lg py-2 text-[13px] font-medium font-jakarta hover:bg-[#F5F6FA] transition-all flex items-center gap-1.5"
                      >
                         {copyStatus === "copied" ? (
                           <>
                             <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             Copied!
                           </>
                         ) : (
                           <>
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             Copy
                           </>
                         )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        className="p-2 text-[#9BA5B4] hover:text-[#5A6474] transition-colors"
                        title="Regenerate"
                      >
                         <svg className={isGenerating ? "animate-spin w-4 h-4" : "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                   </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
