"use client";

import React from "react";

export function BiasIndicator({
  biasFlags
}: {
  biasFlags: Array<{ type?: string; severity?: string; detail?: string }> | undefined | null;
}) {
  const list = biasFlags ?? [];
  if (!list.length) return null;
  const summary = list
    .slice(0, 3)
    .map((b) => `${b.type ?? "bias"} (${b.severity ?? "?"})`)
    .join(", ");

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
      title={summary}
    >
      Bias flagged
      <span className="w-2 h-2 rounded-full bg-amber-500" />
    </div>
  );
}

