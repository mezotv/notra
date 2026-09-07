"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { DashboardAgentContextValue } from "@/types/dashboard/dashboard-agent";

const DashboardAgentContext = createContext<DashboardAgentContextValue | null>(
  null
);

export function DashboardAgentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
  }, []);

  useEffect(() => {
    if (open) {
      setHasOpened(true);
    }
  }, [open]);

  const value = useMemo(
    () => ({ open, hasOpened, setOpen }),
    [hasOpened, open, setOpen]
  );

  return (
    <DashboardAgentContext.Provider value={value}>
      {children}
    </DashboardAgentContext.Provider>
  );
}

export function useDashboardAgent() {
  const context = useContext(DashboardAgentContext);
  if (!context) {
    throw new Error(
      "useDashboardAgent must be used within a DashboardAgentProvider"
    );
  }
  return context;
}
