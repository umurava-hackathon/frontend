"use client";

import React from "react";

export function GreenPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#ECFDF5] border border-[#B7F7D3] px-3 py-1 text-xs font-medium text-[#15803D]">
      {children}
    </span>
  );
}

export function AmberPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FFFBEB] border border-[#FCD34D] px-3 py-1 text-xs font-medium text-[#B45309]">
      {children}
    </span>
  );
}

