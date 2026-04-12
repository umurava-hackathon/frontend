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
        className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warningLight px-3 py-1 text-[11px] font-semibold text-warning transition-card cursor-default"
      >
        Bias flagged
        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
      </div>
      <div className="tooltip-text">
        AI confidence may be influenced by institution name or job title rather than demonstrated skills. Review manually.
      </div>
    </div>
  );
}
