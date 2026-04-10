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
        className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 transition-card"
      >
        Bias flagged
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse-slow shadow-[0_0_4px_rgba(249,115,22,0.6)]" />
      </div>
      <div className="tooltip-text">
        AI confidence may be influenced by institution name or job title rather than demonstrated skills. Review manually.
      </div>
    </div>
  );
}
