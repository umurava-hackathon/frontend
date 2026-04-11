"use client";

import React, { useEffect, useState } from "react";

function colorForScore(score: number) {
  if (score >= 85) return "#16A34A"; // success
  if (score >= 70) return "#2B71F0"; // primary
  if (score >= 50) return "#D97706"; // warning
  return "#DC2626"; // danger
}

export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference);
    }, 200);
    return () => clearTimeout(t);
  }, [pct, circumference]);

  const color = colorForScore(pct);

  return (
    <div className="relative flex items-center justify-center transition-card" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center leading-none">
        <span className="text-[11px] font-bold" style={{ color }}>{Math.round(pct)}</span>
        <span className="text-[7px] uppercase font-bold text-neutral-400 mt-0.5">Match</span>
      </div>
      
      {pct >= 90 && (
        <div className="absolute inset-0 rounded-full animate-pulse ring-4 ring-success/10" style={{ animationIterationCount: 1, animationDuration: '600ms' }} />
      )}
    </div>
  );
}
