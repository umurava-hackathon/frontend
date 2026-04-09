"use client";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export function useAppDispatch() {
  return useDispatch<AppDispatch>();
}

export function useAppSelector<TSelected = unknown>(selector: (state: RootState) => TSelected) {
  return useSelector(selector);
}

