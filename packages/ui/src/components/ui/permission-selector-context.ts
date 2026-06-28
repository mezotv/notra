"use client";

import { createContext, use } from "react";

export type PermissionTone = "neutral" | "success" | "danger" | "warning";

export interface PermissionRowContextValue {
  value: string | undefined;
  select: (value: string) => void;
  layoutId: string;
  disabled: boolean;
}

export const PermissionRowContext =
  createContext<PermissionRowContextValue | null>(null);

export function usePermissionRow() {
  const context = use(PermissionRowContext);
  if (!context) {
    throw new Error("PermissionOption must be used within a PermissionRow");
  }
  return context;
}
