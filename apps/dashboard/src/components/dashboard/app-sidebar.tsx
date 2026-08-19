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
} from "@notra/ui/components/ui/sidebar";
import { Notra } from "@notra/ui/components/ui/svgs/notra";
import { cn } from "@notra/ui/lib/utils";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { resolveDrilldownCategory } from "@/utils/nav";
import { ChatHistoryNav } from "./chat-history-nav";
import { NavBrandIdentity } from "./nav-brand-identity";
import { NavCategory } from "./nav-category";
import { NavMain } from "./nav-main";
import { NavSettings } from "./nav-settings";
import { NavUtility } from "./nav-utility";
import { OrgSelector } from "./org-selector";
import { SidebarLabel } from "./sidebar-label";
import { SidebarOnboarding } from "./sidebar-onboarding";
import { SidebarTrialExpired } from "./sidebar-trial-expired";
import { SidebarUpgrade } from "./sidebar-upgrade";

const createMainVariants = (shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: 0, x: "-100%" },
  animate: { opacity: 1, x: 0 },
  exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: "-100%" },
});

const createSubpageVariants = (shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: 0, x: "100%" },
  animate: { opacity: 1, x: 0 },
  exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: "100%" },
});

const TRANSITION = { duration: 0.2, type: "spring" as const, bounce: 0.1 };

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrganization } = useOrganizationsContext();
  const shouldReduceMotion = useReducedMotion();
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const slug = pathnameSegments[0] ?? activeOrganization?.slug ?? "";

  const section = pathnameSegments[1];
  const isSettingsRoute = section === "settings";
  const isChatRoute = section === "chat";
  const isBrandRoute = section === "brand";
  const drilldownCategory = resolveDrilldownCategory(section);
  const isSubpage =
    isSettingsRoute ||
    isChatRoute ||
    isBrandRoute ||
    drilldownCategory !== null;

  const hasVisitedMainRef = useRef(false);
  useEffect(() => {
    if (!isSubpage) {
      hasVisitedMainRef.current = true;
    }
  }, [isSubpage]);

  function handleBack() {
    if (hasVisitedMainRef.current) {
      router.back();
      return;
    }
    router.push(`/${slug}`);
  }

  const mainVariants = createMainVariants(shouldReduceMotion);
  const subpageVariants = createSubpageVariants(shouldReduceMotion);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn("overflow-hidden overscroll-none border-none", className)}
    >
      <LazyMotion features={domAnimation}>
        <SidebarHeader className="group-data-[collapsible=icon]:px-4">
          <div className="flex h-8 items-center gap-2 px-2 group-data-[collapsible=icon]:px-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg dark:bg-[#F6F3F1]">
              <Notra className="size-7 dark:size-5" />
            </div>
            <SidebarLabel className="font-semibold text-base">
              Notra
            </SidebarLabel>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AnimatePresence initial={false} mode="popLayout">
            {isSubpage && (
              <m.div
                animate="animate"
                className="sticky top-0 z-10 bg-sidebar p-2"
                exit="exit"
                initial="initial"
                key="back-button"
                transition={TRANSITION}
                variants={subpageVariants}
              >
                <SidebarMenu>
                  <SidebarMenuButton
                    className="[&>*]:group-data-[collapsible=icon]:-translate-x-px cursor-pointer transition-colors duration-200 hover:bg-sidebar-accent"
                    onClick={handleBack}
                    tooltip="Back"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} />
                    <SidebarLabel>Back</SidebarLabel>
                  </SidebarMenuButton>
                </SidebarMenu>
              </m.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false} mode="popLayout">
            {isSettingsRoute && (
              <m.div
                animate="animate"
                className="flex flex-1 flex-col"
                exit="exit"
                initial="initial"
                key="settings"
                transition={TRANSITION}
                variants={subpageVariants}
              >
                <NavSettings slug={slug} />
              </m.div>
            )}
            {!isSettingsRoute && isChatRoute && (
              <m.div
                animate="animate"
                className="flex flex-1 flex-col"
                exit="exit"
                initial="initial"
                key="chat"
                transition={TRANSITION}
                variants={subpageVariants}
              >
                <ChatHistoryNav />
              </m.div>
            )}
            {isBrandRoute && (
              <m.div
                animate="animate"
                className="flex flex-1 flex-col"
                exit="exit"
                initial="initial"
                key="brand"
                transition={TRANSITION}
                variants={subpageVariants}
              >
                <NavBrandIdentity slug={slug} />
              </m.div>
            )}
            {drilldownCategory !== null && (
              <m.div
                animate="animate"
                className="flex flex-1 flex-col"
                exit="exit"
                initial="initial"
                key={`category-${drilldownCategory}`}
                transition={TRANSITION}
                variants={subpageVariants}
              >
                <NavCategory category={drilldownCategory} slug={slug} />
              </m.div>
            )}
            {!isSubpage && (
              <m.div
                animate="animate"
                className="flex flex-1 flex-col"
                exit="exit"
                initial="initial"
                key="main"
                transition={TRANSITION}
                variants={mainVariants}
              >
                <NavMain />
              </m.div>
            )}
          </AnimatePresence>
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
      </LazyMotion>
    </Sidebar>
  );
}
