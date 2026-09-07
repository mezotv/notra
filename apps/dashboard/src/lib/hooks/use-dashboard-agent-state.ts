"use client";

import { useState } from "react";

import type { DashboardAgentContextValue } from "@/types/dashboard/dashboard-agent";

export function useDashboardAgentState(): DashboardAgentContextValue {
  const [open, setOpenState] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (next) {
      setHasOpened(true);
    }
  };

  return { open, hasOpened, setOpen };
}
