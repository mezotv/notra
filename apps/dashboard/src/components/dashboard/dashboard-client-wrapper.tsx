"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-context";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { FeedbackProvider } from "@/components/dashboard/feedback-context";
import { SiteHeader } from "@/components/dashboard/header";
import { DatabuddyFlagsProvider } from "@/components/providers/databuddy-flags-provider";
import {
  type InitialActiveOrganization,
  OrganizationsProvider,
} from "@/components/providers/organization-provider";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  initialActiveOrganization?: InitialActiveOrganization | null;
  initialSidebarOpen?: boolean;
  modal?: React.ReactNode;
}

export function DashboardClientWrapper({
  children,
  initialActiveOrganization,
  initialSidebarOpen = true,
  modal,
}: DashboardClientWrapperProps) {
  return (
    <OrganizationsProvider
      initialActiveOrganization={initialActiveOrganization}
    >
      <DatabuddyFlagsProvider>
        <FeedbackProvider>
          <CommandPaletteProvider>
            <SidebarProvider
              className="h-svh overflow-hidden overscroll-none"
              defaultOpen={initialSidebarOpen}
            >
              <DashboardSidebar variant="inset" />
              <SidebarInset className="h-svh min-w-0 overflow-hidden">
                <SiteHeader />
                <div className="@container/main flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain">
                  <SubscriptionGate>{children}</SubscriptionGate>
                </div>
              </SidebarInset>
            </SidebarProvider>
            <CommandPalette />
          </CommandPaletteProvider>
        </FeedbackProvider>
      </DatabuddyFlagsProvider>
      {modal}
    </OrganizationsProvider>
  );
}
