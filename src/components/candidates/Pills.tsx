"use client";

import React from "react";

export function GreenPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#dcfce7] border border-[#86efac] px-3 py-1 text-[12px] font-medium text-[#166534] transition-all duration-150 hover:scale-[1.02]">
      {children}
    </span>
  );
}

export function AmberPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#fef9c3] border border-[#fde047] px-3 py-1 text-[12px] font-medium text-[#854d0e] transition-all duration-150 hover:scale-[1.02]">
      {children}
    </span>
  );
}
