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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";
import { useRef } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { ChatHistoryNav } from "./chat-history-nav";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavSettings } from "./nav-settings";
import { NavUser } from "./nav-user";
import { OrgSelector } from "./org-selector";
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
  const isSubpage = isSettingsRoute || isChatRoute;

  const hasVisitedMainRef = useRef(false);
  if (!isSubpage) {
    hasVisitedMainRef.current = true;
  }

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
      className="overflow-hidden overscroll-none border-none"
    >
      <SidebarHeader>
        <OrgSelector />
        <AnimatePresence initial={false} mode="popLayout">
          {isSubpage && (
            <motion.div
              animate="animate"
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
                  <span>Back</span>
                </SidebarMenuButton>
              </SidebarMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarHeader>
      <SidebarContent>
        <AnimatePresence initial={false} mode="popLayout">
          {isSettingsRoute && (
            <motion.div
              animate="animate"
              className="flex flex-1 flex-col"
              exit="exit"
              initial="initial"
              key="settings"
              transition={TRANSITION}
              variants={subpageVariants}
            >
              <NavSettings slug={slug} />
            </motion.div>
          )}
          {!isSettingsRoute && isChatRoute && (
            <motion.div
              animate="animate"
              className="flex flex-1 flex-col"
              exit="exit"
              initial="initial"
              key="chat"
              transition={TRANSITION}
              variants={subpageVariants}
            >
              <ChatHistoryNav />
              <div className="mt-auto">
                <NavSecondary />
              </div>
            </motion.div>
          )}
          {!(isSettingsRoute || isChatRoute) && (
            <motion.div
              animate="animate"
              className="flex flex-1 flex-col"
              exit="exit"
              initial="initial"
              key="main"
              transition={TRANSITION}
              variants={mainVariants}
            >
              <NavMain />
              <div className="mt-auto">
                <SidebarTrialExpired />
                <SidebarOnboarding />
                <SidebarUpgrade />
                <NavSecondary />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
