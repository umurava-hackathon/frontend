"use client";

import React from "react";

export function RecommendationBadge({ value }: { value: "SHORTLIST" | "CONSIDER" | "DECLINE" }) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    SHORTLIST: { bg: "#ECFDF5", border: "#A7F3D0", text: "#15803D" },
    CONSIDER: { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
    DECLINE: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" }
  };
  const m = map[value];
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}>
      {value}
    </span>
  );
}

