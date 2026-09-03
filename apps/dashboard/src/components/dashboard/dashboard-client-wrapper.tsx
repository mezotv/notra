"use client";

import { CommandPaletteProvider } from "@/components/command-palette/command-palette-context";
import { LazyCommandPalette } from "@/components/command-palette/lazy-command-palette";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FeedbackProvider } from "@/components/dashboard/feedback-context";
import { DatabuddyFlagsProvider } from "@/components/providers/databuddy-flags-provider";
import {
  type InitialActiveOrganization,
  OrganizationsProvider,
} from "@/components/providers/organization-provider";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  initialActiveOrganization?: InitialActiveOrganization | null;
  initialSidebarOpen?: boolean;
  initialSidebarWidth: number;
  modal?: React.ReactNode;
}

export function DashboardClientWrapper({
  children,
  initialActiveOrganization,
  initialSidebarOpen = true,
  initialSidebarWidth,
  modal,
}: DashboardClientWrapperProps) {
  return (
    <OrganizationsProvider
      initialActiveOrganization={initialActiveOrganization}
    >
      <DatabuddyFlagsProvider>
        <FeedbackProvider>
          <CommandPaletteProvider>
            <DashboardShell
              initialSidebarOpen={initialSidebarOpen}
              initialSidebarWidth={initialSidebarWidth}
            >
              {children}
            </DashboardShell>
            <LazyCommandPalette />
          </CommandPaletteProvider>
        </FeedbackProvider>
      </DatabuddyFlagsProvider>
      {modal}
    </OrganizationsProvider>
  );
}
