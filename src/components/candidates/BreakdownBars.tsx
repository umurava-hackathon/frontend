"use client";

import React from "react";

interface BreakdownBarsProps {
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    relevance: number;
  };
}

export function BreakdownBars({ breakdown }: BreakdownBarsProps) {
  const items = [
    { label: "Skills", value: breakdown.skills },
    { label: "Experience", value: breakdown.experience },
    { label: "Education", value: breakdown.education },
    { label: "Relevance", value: breakdown.relevance },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {items.map((item) => {
        const color = item.value >= 85 
          ? "bg-[#10B981]" 
          : item.value >= 60 
            ? "bg-[#2B71F0]" 
            : item.value >= 40 
              ? "bg-amber-500" 
              : "bg-red-500";
        
        return (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#9BA5B4] uppercase tracking-widest">
              <span>{item.label}</span>
              <span className={item.value >= 85 ? "text-[#10B981]" : "text-[#0F1621]"}>{item.value}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden border border-[#F1F5F9]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
