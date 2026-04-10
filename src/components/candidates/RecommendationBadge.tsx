"use client";

import React from "react";

export function RecommendationBadge({ value }: { value: "SHORTLIST" | "CONSIDER" | "DECLINE" }) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    SHORTLIST: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
    CONSIDER: { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
    DECLINE: { bg: "#fee2e2", border: "#fecaca", text: "#991b1b" }
  };
  const m = map[value];
  return (
    <span 
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-150 hover:brightness-95 cursor-default select-none shadow-sm" 
      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}
    >
      {value}
    </span>
  );
}
