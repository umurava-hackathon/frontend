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
        const color = item.value >= 90 ? "#10B981" : "#2B71F0";
        
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-semibold text-[#5A6474] uppercase tracking-wider">
              <span>{item.label}</span>
              <span className="text-[#0F1621]">{item.value}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E8EAED] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${item.value}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
