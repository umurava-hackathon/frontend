"use client";

import React, { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { thunkFetchMe } from "@/store/slices/dashboardSlice";

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // We check for the cookie before fetching to avoid 401s on every load for new users
    // Note: JS can't read httpOnly cookie value, but document.cookie might show its presence 
    // depending on SameSite/Secure. More reliably, we just try the fetch and handle the error.
    void dispatch(thunkFetchMe() as any);
  }, [dispatch]);

  return <>{children}</>;
}
