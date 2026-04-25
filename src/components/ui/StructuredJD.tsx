"use client";

import React from "react";

interface StructuredJDProps {
  content: string;
  className?: string;
}

export function StructuredJD({ content, className }: StructuredJDProps) {
  if (!content) return null;

  // Simple parser to identify sections and format them
  const lines = content.split("\n");
  const processed = lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-4" />;

    // Check if it looks like a header (all caps, or specific keywords)
    const isHeader = 
      (trimmed.toUpperCase() === trimmed && trimmed.length > 3) ||
      trimmed.endsWith(":") ||
      ["ABOUT THE ROLE", "KEY RESPONSIBILITIES", "QUALIFICATIONS", "NICE TO HAVE", "WHAT WE OFFER", "MISSION"].some(h => trimmed.toUpperCase().includes(h));

    if (isHeader) {
      return (
        <h3 key={idx} className="text-[14px] font-black text-[#0F1621] uppercase tracking-[0.2em] mt-8 mb-4 first:mt-0">
          {trimmed.replace(":", "")}
        </h3>
      );
    }

    // Check if it's a list item
    if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
      return (
        <div key={idx} className="flex gap-3 mb-2 pl-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#2B71F0] mt-2 shrink-0" />
          <span className="text-[15px] text-[#5A6474] font-medium leading-relaxed">
            {trimmed.substring(1).trim()}
          </span>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p key={idx} className="text-[15px] text-[#5A6474] leading-[1.8] font-medium mb-4">
        {trimmed}
      </p>
    );
  });

  return (
    <div className={className}>
      {processed}
    </div>
  );
}
