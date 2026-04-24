"use client";

import React, { useState, useRef } from "react";

interface BiasFlag {
  type?: string;
  severity?: string;
  detail?: string;
  mitigation?: string;
}

export function BiasIndicator({
  biasFlags
}: {
  biasFlags: BiasFlag[] | undefined | null;
}) {
  const list = biasFlags ?? [];
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  if (!list.length) return null;

  const handleMouseEnter = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setIsFlipped(rect.top < 120);
    }
    setShowTooltip(true);
  };

  const badgeText = list.length === 1 ? "Bias flagged" : `${list.length} flags`;

  return (
    <div className="relative inline-block">
      <div
        ref={badgeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-2 rounded-full border border-[#FDE047] bg-[#FEF9C3] px-3 py-1 text-[11px] font-bold text-[#92400E] cursor-default group"
      >
        {badgeText}
        <span className="w-1.5 h-1.5 rounded-full bg-[#92400E] animate-pulse group-hover:animate-none" />
      </div>

      {showTooltip && (
        <div 
          className={`absolute left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-max max-max-w-[260px] animate-in fade-in slide-in-from-bottom-1 duration-150 ${
            isFlipped ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]"
          }`}
        >
          <div className="bg-[#1E293B] text-[#F8FAFC] rounded-lg p-[10px_14px] shadow-[0_4px_16px_rgba(0,0,0,0.20)] relative">
            <div className="space-y-4">
              {list.map((flag, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-white/10 pt-2 mt-2" : ""}>
                  <div className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-[0.06em]">
                    {(flag.type || "Bias detected").replace(/_/g, " ")}
                  </div>
                  <div className="text-[13px] text-[#F8FAFC] leading-relaxed mt-1">
                    {flag.detail}
                  </div>
                  {flag.mitigation && (
                    <div className="text-[12px] italic text-[#94A3B8] mt-[6px] pt-[6px] border-t border-white/10">
                      {flag.mitigation}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${
                isFlipped 
                  ? "top-[-6px] border-b-[6px] border-b-[#1E293B]" 
                  : "bottom-[-6px] border-t-[6px] border-t-[#1E293B]"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
