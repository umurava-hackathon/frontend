"use client";

import React from "react";
import classNames from "classnames";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ 
  children, 
  className, 
  accentColor, 
  hoverable = true,
  padding = "md"
}: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={classNames(
      "relative bg-white rounded-2xl border border-[#E8EAED] overflow-hidden transition-all duration-300",
      hoverable && "hover:shadow-md hover:-translate-y-0.5",
      paddingClasses[padding],
      className
    )}>
      {accentColor && (
        <div 
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[4px] rounded-full h-[60%]"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className={classNames(accentColor && "pl-4")}>
        {children}
      </div>
    </div>
  );
}
