"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/header";
import { OnboardingAgentBanner } from "@/components/dashboard/onboarding-agent-banner";
import { EVE_BANNER_HEIGHT } from "@/constants/onboarding-agent";
import { useOnboardingAgentBanner } from "@/lib/hooks/use-onboarding-agent-banner";
import type {
  DashboardShellProps,
  DashboardShellStyle,
} from "@/types/components/dashboard-shell";

export function DashboardShell({
  children,
  initialSidebarOpen,
}: DashboardShellProps) {
  const { visible, debug } = useOnboardingAgentBanner();
  const shellStyle: DashboardShellStyle = {
    "--eve-banner-height": visible ? EVE_BANNER_HEIGHT : "0rem",
  };

  return (
    <div
      className="flex h-svh flex-col overflow-hidden overscroll-none"
      style={shellStyle}
    >
      {visible ? <OnboardingAgentBanner debug={debug} /> : null}
      <SidebarProvider
        className="min-h-0 flex-1 overflow-hidden overscroll-none"
        defaultOpen={initialSidebarOpen}
      >
        <DashboardSidebar
          className="md:top-(--eve-banner-height) md:h-[calc(100svh-var(--eve-banner-height))]"
          variant="inset"
        />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <SiteHeader />
          <div className="@container/main flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain">
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
