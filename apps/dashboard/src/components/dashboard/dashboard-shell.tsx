"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { toast } from "sonner";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/header";
import { OnboardingAgentBanner } from "@/components/dashboard/onboarding-agent-banner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { EVE_BANNER_HEIGHT } from "@/constants/onboarding-agent";
import { RIGHT_PANEL_PORTAL_ID } from "@/constants/right-panel";
import {
  useOnboardingAgentBannerDismissal,
  useOnboardingAgentRun,
  useRunOnboardingAgent,
} from "@/lib/hooks/use-onboarding";
import type {
  DashboardShellProps,
  DashboardShellStyle,
} from "@/types/components/dashboard-shell";

export function DashboardShell({
  children,
  initialSidebarOpen,
}: DashboardShellProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const { data } = useOnboardingAgentRun(organizationId);
  const runAgent = useRunOnboardingAgent();
  const { dismiss, dismissed } =
    useOnboardingAgentBannerDismissal(organizationId);
  const running = data?.running ?? false;
  const canStart = !!data && !data.ran && !running && !dismissed;
  const visible = running || canStart;
  const starting =
    runAgent.isPending && runAgent.variables?.organizationId === organizationId;
  const shellStyle: DashboardShellStyle = {
    "--eve-banner-height": visible ? EVE_BANNER_HEIGHT : "0rem",
  };

  const handleStart = () => {
    if (!organizationId || starting) {
      return;
    }
    runAgent.mutate(
      { organizationId },
      {
        onError: (error) =>
          toast.error(
            error.message || "Couldn't start the setup agent. Try again later."
          ),
      }
    );
  };

  return (
    <div
      className="flex h-svh flex-col overflow-hidden overscroll-none"
      style={shellStyle}
    >
      {visible ? (
        <OnboardingAgentBanner
          onDismiss={dismiss}
          onStart={handleStart}
          starting={starting}
          state={running ? "running" : "idle"}
        />
      ) : null}
      <SidebarProvider
        className="min-h-0! flex-1 overflow-hidden overscroll-none"
        defaultOpen={initialSidebarOpen}
      >
        <DashboardSidebar
          className="md:top-(--eve-banner-height) md:h-[calc(100svh-var(--eve-banner-height))]"
          variant="inset"
        />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <SiteHeader />
          <div className="@container/main scrollbar-stable flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain">
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </SidebarInset>
        <div className="contents" id={RIGHT_PANEL_PORTAL_ID} />
      </SidebarProvider>
    </div>
  );
}
