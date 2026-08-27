"use client";

import { useEffect } from "react";

import { subscribeToAutumnRefresh } from "@/lib/billing/autumn-refresh";
import type { AutumnRefreshListener } from "@/types/billing/autumn-refresh";

export function useAutumnRefreshListener(listener: AutumnRefreshListener) {
  useEffect(() => subscribeToAutumnRefresh(listener), [listener]);
}
