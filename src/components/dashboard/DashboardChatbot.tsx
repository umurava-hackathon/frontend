"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiChatWithDashboard } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";

export function DashboardChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestionChips = [
    "Summarize my recent activity",
    "How are my latest jobs performing?",
    "What should I focus on next?",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiChatWithDashboard(text, messages);
      setMessages([...newMessages, { role: "assistant", content: response.reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "I'm having trouble connecting to the intelligence engine. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-[56px] h-[56px] rounded-full bg-[#0F1621] text-white shadow-2xl shadow-black/20 hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center group"
        >
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </button>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "72px" : "500px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-8 right-8 w-[calc(100vw-64px)] sm:w-[380px] bg-white border border-[#E8EAED] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-50 max-h-[70vh] sm:max-h-none font-jakarta"
          >
            {/* Header */}
            <div className="h-[72px] bg-white border-b border-[#F1F5F9] px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F8F9FB] flex items-center justify-center border border-[#E8EAED]">
                   <svg className="w-5 h-5 text-[#0F1621]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#0F1621] text-[14px] font-bold uppercase tracking-widest leading-tight">Insight Engine</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2B71F0]" />
                    <span className="text-[#9BA5B4] text-[10px] font-bold uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-[#9BA5B4] hover:text-[#0F1621] hover:bg-[#F8F9FB] rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 12H6" /></svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-[#9BA5B4] hover:text-[#0F1621] hover:bg-[#F8F9FB] rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-white">
                  {/* Welcome Message */}
                  <div className="self-start space-y-1 max-w-[90%]">
                    <div className="bg-[#F8F9FB] text-[#0F1621] rounded-2xl rounded-tl-none p-4 text-[14px] font-medium leading-relaxed border border-[#E8EAED]">
                      I've reviewed your recent recruitment signals. How can I help you understand your pipeline today?
                    </div>
                  </div>

                  {messages.length === 0 && (
                    <div className="flex flex-col gap-2 py-2">
                      {suggestionChips.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(chip)}
                          className="bg-white border border-[#E8EAED] rounded-xl px-5 py-3 text-[#2B71F0] text-[12px] font-bold hover:bg-[#F5F8FF] hover:border-[#2B71F0]/30 transition-all text-left animate-in fade-in slide-in-from-left-2 shadow-sm"
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
                        "max-w-[90%] flex flex-col gap-1.5",
                        msg.role === "user" ? "self-end items-end" : "self-start items-start"
                      )}
                    >
                      <div
                        className={classNames(
                          "p-4 text-[14px] font-medium leading-relaxed shadow-sm",
                          msg.role === "user" 
                            ? "bg-[#2B71F0] text-white rounded-2xl rounded-tr-none" 
                            : "bg-[#F8F9FB] text-[#0F1621] rounded-2xl rounded-tl-none border border-[#E8EAED]"
                        )}
                      >
                        {formatMessage(msg.content)}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="self-start bg-[#F8F9FB] rounded-2xl rounded-tl-none p-4 border border-[#E8EAED]">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-[#2B71F0]/40 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-[#F1F5F9] bg-white">
                  <div className="relative flex items-end gap-2 bg-[#F8F9FC] border-2 border-transparent rounded-[24px] px-5 py-3 focus-within:bg-white focus-within:border-[#2B71F0]/20 transition-all shadow-inner">
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
                      placeholder="Ask the assistant..."
                      className="flex-1 bg-transparent text-[14px] text-[#0F1621] font-medium outline-none resize-none max-h-32 py-1"
                      style={{ height: 'auto' }}
                    />
                    <button
                      disabled={!input.trim() || isLoading}
                      onClick={() => handleSend(input)}
                      className="w-10 h-10 shrink-0 rounded-2xl bg-[#0F1621] flex items-center justify-center text-white hover:bg-black disabled:bg-[#E8EAED] disabled:text-[#9BA5B4] transition-all active:scale-90 mb-0.5"
                    >
                      <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                     <span className="text-[10px] font-black text-[#9BA5B4] uppercase tracking-[0.2em]">Powered by GEMINI AI</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
