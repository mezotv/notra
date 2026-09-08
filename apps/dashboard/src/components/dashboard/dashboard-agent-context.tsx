"use client";

import { createContext, useContext } from "react";

import { useDashboardAgentState } from "@/lib/hooks/use-dashboard-agent-state";
import type { DashboardAgentContextValue } from "@/types/dashboard/dashboard-agent";

const DashboardAgentContext = createContext<DashboardAgentContextValue | null>(
  null
);

export function DashboardAgentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useDashboardAgentState();

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
