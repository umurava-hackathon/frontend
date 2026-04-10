"use client";

import React, { useEffect, useState } from "react";

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function colorForScore(score: number) {
  if (score >= 80) return "bg-blue-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function BreakdownBars({ breakdown }: { breakdown: Record<string, number> }) {
  const [widths, setWidths] = useState<Record<string, number>>({
    skills: 0,
    experience: 0,
    education: 0,
    relevance: 0
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setWidths({
        skills: breakdown.skills ?? 0,
        experience: breakdown.experience ?? 0,
        education: breakdown.education ?? 0,
        relevance: breakdown.relevance ?? 0
      });
    }, 100);
    return () => clearTimeout(t);
  }, [breakdown]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {(Object.entries(widths) as Array<[string, number]>).map(([key, val], idx) => (
        <div key={key} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 min-w-[80px]">
              {key}
            </div>
            <div className="text-[11px] font-bold text-gray-900">{breakdown[key] ?? 0}%</div>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={classNames(
                "h-full rounded-full transition-all duration-600 ease-out",
                colorForScore(breakdown[key] ?? 0)
              )}
              style={{ 
                width: `${val}%`,
                transitionDelay: `${idx * 100}ms`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
