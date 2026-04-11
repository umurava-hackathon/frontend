"use client";

import React from "react";

export function RecommendationBadge({ value }: { value: "SHORTLIST" | "CONSIDER" | "DECLINE" }) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    SHORTLIST: { bg: "#DCFCE7", border: "#86EFAC", text: "#166534" },
    CONSIDER: { bg: "#FEF9C3", border: "#FDE047", text: "#854D0E" },
    DECLINE: { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" }
  };
  const m = map[value];
  return (
    <span 
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 hover:brightness-95 cursor-default select-none shadow-sm" 
      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}
    >
      {value}
    </span>
  );
}
