"use client";

import React from "react";

export function RecommendationBadge({ value }: { value: string }) {
  const isShortlist = value === "SHORTLIST";
  
  return (
    <span className={`
      px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border
      ${isShortlist 
        ? "bg-[#2B71F0] text-white border-[#2B71F0]" 
        : "bg-[#E8EAED] text-[#5A6474] border-[#E8EAED]"}
    `}>
      {value}
    </span>
  );
}
