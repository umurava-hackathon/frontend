"use client";

import React from "react";

export function BiasIndicator({
  biasFlags
}: {
  biasFlags: Array<{ type?: string; severity?: string; detail?: string }> | undefined | null;
}) {
  const list = biasFlags ?? [];
  if (!list.length) return null;

  return (
    <div className="tooltip-container">
      <div
        className="inline-flex items-center gap-2 rounded-full border border-[#FCD34D] bg-[#FEF3C7] px-3 py-1 text-[11px] font-semibold text-[#92400E] transition-card cursor-default"
      >
        Bias flagged
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
      </div>
      <div className="tooltip-text">
        AI confidence may be influenced by institution name or job title rather than demonstrated skills. Review manually.
      </div>
    </div>
  );
}
