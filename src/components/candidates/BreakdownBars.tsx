"use client";

import React from "react";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-700">
        <span>{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#2563EB]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function BreakdownBars({ breakdown }: { breakdown: { skills: number; experience: number; education: number; relevance: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Bar label="Skills" value={breakdown.skills} />
      <Bar label="Experience" value={breakdown.experience} />
      <Bar label="Education" value={breakdown.education} />
      <Bar label="Relevance" value={breakdown.relevance} />
    </div>
  );
}

