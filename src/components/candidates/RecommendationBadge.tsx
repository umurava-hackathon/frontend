"use client";

import React from "react";

const variantClasses: Record<string, string> = {
  SHORTLIST: "bg-successLight text-success border-success/30",
  CONSIDER:  "bg-warningLight text-warning border-warning/30",
  DECLINE:   "bg-dangerLight  text-danger  border-danger/30",
};

export function RecommendationBadge({ value }: { value: "SHORTLIST" | "CONSIDER" | "DECLINE" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider select-none cursor-default transition-all duration-150 hover:brightness-95 ${variantClasses[value] ?? ""}`}
    >
      {value}
    </span>
  );
}
