"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./store";
import { injectStore } from "../lib/api";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
    // Inject store into API layer for interceptors
    injectStore(storeRef.current);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
