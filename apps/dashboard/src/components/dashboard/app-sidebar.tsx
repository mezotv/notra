"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useEffect, useRef } from "react";

import { useOrganizationsContext } from "@/components/providers/organization-provider";

import { ChatHistoryNav } from "./chat-history-nav";
import { NavBrandIdentity } from "./nav-brand-identity";
import { NavMain } from "./nav-main";
import { NavSettings } from "./nav-settings";
import { NavUtility } from "./nav-utility";
import { OrgSelector } from "./org-selector";
import { SidebarLabel } from "./sidebar-label";
import { SidebarOnboarding } from "./sidebar-onboarding";
import { SidebarProjectSwitcher } from "./sidebar-project-switcher";
import { SidebarSwap } from "./sidebar-swap";
import { SidebarTrialExpired } from "./sidebar-trial-expired";
import { SidebarUpgrade } from "./sidebar-upgrade";

function SidebarBackButton({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-sidebar sticky top-0 z-10 p-2">
      <SidebarMenu>
        <SidebarMenuButton
          className="hover:bg-sidebar-accent cursor-pointer transition-colors duration-200 [&>*]:group-data-[collapsible=icon]:-translate-x-px"
          onClick={onBack}
          tooltip="Back"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
          <SidebarLabel>Back</SidebarLabel>
        </SidebarMenuButton>
      </SidebarMenu>
    </div>
  );
}

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeOrganization } = useOrganizationsContext();
  const navigationKey = `${pathname}?${searchParams.toString()}`;
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const slug = pathnameSegments[0] ?? activeOrganization?.slug ?? "";

  const section = pathnameSegments[1];
  const panelId =
    section === "settings" || section === "chat" || section === "brand"
      ? section
      : "main";
  const isSubpage = panelId !== "main";

  const hasVisitedMainRef = useRef(false);
  const previousNavigationKeyRef = useRef(navigationKey);
  useEffect(() => {
    if (!isSubpage) {
      hasVisitedMainRef.current = true;
    }
  }, [isSubpage]);

  useEffect(() => {
    if (previousNavigationKeyRef.current !== navigationKey && isMobile) {
      setOpenMobile(false);
    }
    previousNavigationKeyRef.current = navigationKey;
  }, [isMobile, navigationKey, setOpenMobile]);

  function handleBack() {
    if (hasVisitedMainRef.current) {
      router.back();
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn("overflow-hidden overscroll-none border-none", className)}
    >
      <SidebarHeader>
        <SidebarProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarSwap
          activeId={panelId}
          className="flex min-h-0 flex-1 flex-col overflow-x-clip"
          items={[
            {
              id: "main",
              side: "left",
              className: "flex-1",
              children: <NavMain />,
            },
            {
              id: "chat",
              side: "right",
              className: "flex-1",
              children: (
                <>
                  <SidebarBackButton onBack={handleBack} />
                  <ChatHistoryNav />
                </>
              ),
            },
            {
              id: "settings",
              side: "right",
              className: "flex-1",
              children: (
                <>
                  <SidebarBackButton onBack={handleBack} />
                  <NavSettings slug={slug} />
                </>
              ),
            },
            {
              id: "brand",
              side: "right",
              className: "flex-1",
              children: (
                <>
                  <SidebarBackButton onBack={handleBack} />
                  <NavBrandIdentity slug={slug} />
                </>
              ),
            },
          ]}
        />
        <div className="mt-auto">
          <NavUtility slug={slug} />
          <SidebarTrialExpired />
          <SidebarOnboarding />
          <SidebarUpgrade />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <OrgSelector />
      </SidebarFooter>
    </Sidebar>
  );
}
