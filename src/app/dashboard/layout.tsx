import type { Metadata } from "next";
import React from "react";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Recruiter Dashboard"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

