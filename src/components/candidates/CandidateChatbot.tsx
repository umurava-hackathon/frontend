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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "56px" : "520px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-[88px] right-6 w-full sm:w-[400px] bg-white border border-[#E8EAED] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] flex flex-col overflow-hidden z-50 max-h-[70vh] sm:max-h-none"
          >
            {/* Header */}
            <div className="h-14 bg-[#2B71F0] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>
                </div>
                <span className="text-white text-sm font-semibold font-jakarta">Recruitment Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 text-white hover:bg-white/10 rounded transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-white hover:bg-white/10 rounded transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Context Indicator */}
                <div className="h-8 bg-[#EEF4FF] border-b border-[#BBCFFF] px-4 flex items-center shrink-0">
                  <span className="text-[#2B71F0] text-[11px] font-jakarta font-medium uppercase tracking-wider">
                    Analysing {candidateCount} candidates for {jobTitle}
                  </span>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                  {/* Welcome Message */}
                  <div className="self-start bg-[#F5F6FA] text-[#0F1621] rounded-2xl rounded-bl-none p-3 max-w-[85%] text-[13px] font-jakarta leading-relaxed shadow-sm">
                    Hi! I've analysed all {candidateCount} candidates for **{jobTitle}**. Ask me anything about the shortlist.
                  </div>

                  {messages.length === 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {suggestionChips.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(chip)}
                          className="shrink-0 bg-white border border-[#E8EAED] rounded-full px-3 py-1.5 text-[#2B71F0] text-[12px] font-medium font-jakarta hover:bg-[#EEF4FF] hover:border-[#2B71F0] transition-all"
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
                        "max-w-[85%] p-3 text-[13px] font-jakarta leading-relaxed shadow-sm",
                        msg.role === "user" 
                          ? "self-end bg-[#2B71F0] text-white rounded-2xl rounded-br-none" 
                          : "self-start bg-[#F5F6FA] text-[#0F1621] rounded-2xl rounded-bl-none"
                      )}
                    >
                      {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="self-start bg-[#F5F6FA] rounded-2xl rounded-bl-none p-3 shadow-sm">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 bg-[#9BA5B4] rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-[#E8EAED] flex items-end gap-2 shrink-0">
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
                    placeholder="Ask about candidates..."
                    className="flex-1 bg-[#F5F6FA] border border-[#E8EAED] rounded-2xl px-4 py-2 text-[13px] text-[#0F1621] font-jakarta outline-none focus:border-[#2B71F0] resize-none max-h-32"
                    style={{ height: 'auto' }}
                  />
                  <button
                    disabled={!input.trim() || isLoading}
                    onClick={() => handleSend(input)}
                    className="w-8.5 h-8.5 shrink-0 rounded-full bg-[#2B71F0] flex items-center justify-center text-white hover:bg-[#1A5CE0] disabled:bg-[#E8EAED] transition-colors p-2"
                  >
                    <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
