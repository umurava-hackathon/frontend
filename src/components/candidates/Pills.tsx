"use client";

import React from "react";

export function GreenPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-successLight border border-success/30 px-3 py-1 text-[12px] font-medium text-success transition-all duration-150 hover:scale-[1.02]">
      {children}
    </span>
  );
}

export function AmberPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-warningLight border border-warning/30 px-3 py-1 text-[12px] font-medium text-warning transition-all duration-150 hover:scale-[1.02]">
      {children}
    </span>
  );
}
