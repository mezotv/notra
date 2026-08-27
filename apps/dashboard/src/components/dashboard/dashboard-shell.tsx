"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/header";
import { OnboardingAgentBanner } from "@/components/dashboard/onboarding-agent-banner";
import { RestoreSidebarHome } from "@/components/dashboard/restore-sidebar-home";
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
  const pathname = usePathname();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [mainScrolled, setMainScrolled] = useState(false);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) {
      return;
    }

    const sync = () => {
      const next = el.scrollTop > 0;
      setMainScrolled((current) => (current === next ? current : next));
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [pathname]);

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
          className={cn(
            "md:top-(--eve-banner-height) md:h-[calc(100svh-var(--eve-banner-height))]",
            visible && "md:pt-0!"
          )}
          variant="inset"
        />
        <SidebarInset
          className={cn(
            "border-sidebar-border min-h-0 min-w-0 overflow-hidden",
            visible && "md:mt-0! md:rounded-t-none! md:border-t-0!"
          )}
        >
          <SiteHeader />
          <RestoreSidebarHome />
          <div className="bg-muted relative flex min-h-0 flex-1 flex-col">
            <div
              className="scrollbar-stable scrollbar-floating border-sidebar-border bg-background @container/main -mx-px flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl border border-b-0"
              ref={mainScrollRef}
            >
              <SubscriptionGate>{children}</SubscriptionGate>
            </div>
            <div
              aria-hidden
              className={cn(
                "from-background pointer-events-none absolute -inset-x-px top-px z-10 h-12 rounded-t-[calc(1rem-1px)] bg-linear-to-b from-20% to-transparent transition-opacity duration-200 ease-out motion-reduce:transition-none",
                mainScrolled ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        </SidebarInset>
        <div className="contents" id={RIGHT_PANEL_PORTAL_ID} />
      </SidebarProvider>
    </div>
  );
}
