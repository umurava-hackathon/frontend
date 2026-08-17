"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { thunkFetchMe } from "@/store/slices/dashboardSlice";
import { apiRefresh, getAccessToken } from "@/lib/api";

const PUBLIC_PATHS = ["/login", "/register"];

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    let cancelled = false;

    const restoreSession = async () => {
      if (!getAccessToken()) {
        try {
          await apiRefresh();
        } catch {
          return;
        }
      }
      if (!cancelled) {
        void dispatch(thunkFetchMe() as any);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [dispatch, pathname]);

  return <>{children}</>;
}
