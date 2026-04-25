"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiChatWithShortlist } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CandidateChatbotProps {
  jobId: string;
  jobTitle: string;
  candidateCount: number;
  hasResults: boolean;
}

const suggestionChips = [
  "Who has the strongest Node.js skills?",
  "Compare the top 2 candidates",
  "Which candidates are immediately available?",
  "Who has the most relevant projects?",
  "Any red flags I should know about?"
];

export function CandidateChatbot({ jobId, jobTitle, candidateCount, hasResults }: CandidateChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiChatWithShortlist(jobId, text, messages);
      setMessages([...newMessages, { role: "assistant", content: response.reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong, please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    // Simple regex for bold and bullet points
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\u2022 (.*)$/gm, "<li>$1</li>")
      .split('\n').map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line }} />);
  };

  if (!hasResults) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 w-[52px] h-[52px] rounded-full bg-[#2B71F0] shadow-[0_4px_16px_rgba(43,113,240,0.35)] flex items-center justify-center text-white z-50 hover:bg-[#1A5CE0] hover:scale-105 transition-all duration-150"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <>
            <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#10B981] border-2 border-white rounded-full" />
          </>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "64px" : "580px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-24 right-6 w-[calc(100vw-48px)] sm:w-[420px] bg-white border border-[#E8EAED] rounded-2xl shadow-[0_12px_40px_rgba(15,22,33,0.15)] flex flex-col overflow-hidden z-50 max-h-[75vh] sm:max-h-none"
          >
            {/* Header */}
            <div className="h-16 bg-[#2B71F0] px-5 flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-[15px] font-bold font-jakarta leading-tight">AI Assistant</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/70 text-[11px] font-medium font-jakarta uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Context Indicator */}
                <div className="h-10 bg-[#F5F8FF] border-b border-[#DDE7FF] px-5 flex items-center shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[#2B71F0] text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                      Screening: {jobTitle}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#BBCFFF] shrink-0" />
                    <span className="text-[#5A6474] text-[11px] font-medium whitespace-nowrap">
                      {candidateCount} candidates
                    </span>
                  </div>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar bg-[#FFFFFF]">
                  {/* Welcome Message */}
                  <div className="self-start space-y-1 max-w-[88%] animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="bg-[#F1F5F9] text-[#0F1621] rounded-2xl rounded-tl-none p-3.5 text-[13.5px] font-jakarta leading-relaxed shadow-sm border border-[#E2E8F0]">
                      Hi! I'm your AI recruiter. I've analysed the shortlist for **{jobTitle}**. How can I help you today?
                    </div>
                  </div>

                  {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                      {suggestionChips.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(chip)}
                          className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-[#2B71F0] text-[12px] font-semibold font-jakarta hover:bg-[#F5F8FF] hover:border-[#2B71F0] hover:shadow-sm transition-all text-left animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${150 + i * 50}ms` }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={classNames(
                        "max-w-[88%] flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        msg.role === "user" ? "self-end items-end" : "self-start items-start"
                      )}
                    >
                      <div
                        className={classNames(
                          "p-3.5 text-[13.5px] font-jakarta leading-relaxed shadow-sm",
                          msg.role === "user" 
                            ? "bg-[#2B71F0] text-white rounded-2xl rounded-tr-none" 
                            : "bg-[#F1F5F9] text-[#0F1621] rounded-2xl rounded-tl-none border border-[#E2E8F0]"
                        )}
                      >
                        {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                      </div>
                      <span className="text-[10px] text-[#9BA5B4] font-bold uppercase tracking-wider px-1">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="self-start bg-[#F1F5F9] rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#E2E8F0]">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-2 h-2 bg-[#2B71F0]/50 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[#E8EAED] bg-white shrink-0">
                  <div className="relative flex items-end gap-2 bg-[#F8F9FC] border border-[#E8EAED] rounded-2xl px-4 py-2.5 focus-within:border-[#2B71F0] focus-within:ring-4 focus-within:ring-[#2B71F0]/10 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(input);
                        }
                      }}
                      rows={1}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-[14px] text-[#0F1621] font-jakarta outline-none resize-none max-h-32 py-1"
                      style={{ height: 'auto' }}
                    />
                    <button
                      disabled={!input.trim() || isLoading}
                      onClick={() => handleSend(input)}
                      className="w-10 h-10 shrink-0 rounded-xl bg-[#2B71F0] flex items-center justify-center text-white hover:bg-[#1A5CE0] disabled:bg-[#E8EAED] disabled:text-[#9BA5B4] transition-all shadow-md shadow-blue-500/20 active:scale-95 mb-0.5"
                    >
                      <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-[#9BA5B4] mt-3 font-medium uppercase tracking-[0.05em]">
                    Powered by GEMINI AI
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
