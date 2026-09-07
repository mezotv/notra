"use client";

import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";

import { useDashboardAgent } from "@/components/dashboard/dashboard-agent-context";
import { DASHBOARD_AGENT_TITLE } from "@/constants/dashboard-agent";

export function DashboardAgentButton() {
  const { open, setOpen } = useDashboardAgent();

  return (
    <Button
      aria-pressed={open}
      className="hover:bg-background hidden lg:inline-flex"
      onClick={() => setOpen(!open)}
      size="sm"
      variant={open ? "secondary" : "ghost"}
    >
      <HugeiconsIcon icon={Robot01Icon} strokeWidth={1.8} />
      {DASHBOARD_AGENT_TITLE}
    </Button>
  );
}
