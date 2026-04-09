"use client";

import React from "react";

function colorForScore(score: number) {
  if (score >= 80) return "#16A34A"; // green
  if (score >= 60) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circumference;
  const color = colorForScore(pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute text-[11px] font-semibold text-gray-900">{pct}</div>
      <div className="absolute bottom-[2px] text-[9px] text-gray-500">score</div>
    </div>
  );
}

