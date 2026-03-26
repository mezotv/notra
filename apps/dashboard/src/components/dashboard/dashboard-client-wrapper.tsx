"use client";

import { SidebarInset, SidebarProvider } from "@notra/ui/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/header";
import {
  type InitialActiveOrganization,
  OrganizationsProvider,
} from "@/components/providers/organization-provider";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  initialActiveOrganization?: InitialActiveOrganization | null;
  initialSidebarOpen?: boolean;
}

export function DashboardClientWrapper({
  children,
  initialActiveOrganization,
  initialSidebarOpen = true,
}: DashboardClientWrapperProps) {
  return (
    <OrganizationsProvider
      initialActiveOrganization={initialActiveOrganization}
    >
      <SidebarProvider
        className="h-svh overflow-hidden overscroll-none"
        defaultOpen={initialSidebarOpen}
      >
        <DashboardSidebar variant="inset" />
        <SidebarInset className="h-svh min-w-0 overflow-hidden">
          <SiteHeader />
          <div className="@container/main flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationsProvider>
  );
}
