"use client";

import { DashboardSidebar } from "@/components/dashboard/app-sidebar";
import { OrganizationsProvider } from "@/components/providers/organization-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationsProvider>
      <SidebarProvider>
        <div className="relative flex h-screen w-full">
          <DashboardSidebar />
          <SidebarInset className="flex flex-col">{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </OrganizationsProvider>
  );
}
