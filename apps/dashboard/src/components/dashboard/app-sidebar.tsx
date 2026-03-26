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
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { NavMain } from "./nav-main";
import { NavSettings } from "./nav-settings";
import { NavUser } from "./nav-user";
import { OrgSelector } from "./org-selector";
import { SidebarOnboarding } from "./sidebar-onboarding";
import { SidebarUpgrade } from "./sidebar-upgrade";

const createMainVariants = (shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: 0, x: "-100%" },
  animate: { opacity: 1, x: 0 },
  exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: "-100%" },
});

const createSettingsVariants = (shouldReduceMotion: boolean | null) => ({
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
  const { activeOrganization } = useOrganizationsContext();
  const shouldReduceMotion = useReducedMotion();
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const slug = pathnameSegments[0] ?? activeOrganization?.slug ?? "";

  const section = pathnameSegments[1];
  const isSettingsRoute = section === "settings" || section === "billing";

  const mainVariants = shouldReduceMotion
    ? createMainVariants(true)
    : createMainVariants(false);
  const settingsVariants = shouldReduceMotion
    ? createSettingsVariants(true)
    : createSettingsVariants(false);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="overflow-hidden overscroll-none border-none"
    >
      <SidebarHeader>
        <OrgSelector />
        <AnimatePresence initial={false} mode="popLayout">
          {isSettingsRoute && (
            <motion.div
              animate="animate"
              exit="exit"
              initial="initial"
              key="back-button"
              transition={TRANSITION}
              variants={settingsVariants}
            >
              <SidebarMenu>
                <SidebarMenuButton
                  className="border border-transparent transition-colors duration-200 hover:bg-sidebar-accent"
                  render={
                    <Link href={`/${slug}`}>
                      <HugeiconsIcon icon={ArrowLeft01Icon} />
                      <span>Back</span>
                    </Link>
                  }
                  tooltip="Back"
                />
              </SidebarMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarHeader>
      <SidebarContent>
        <AnimatePresence initial={false} mode="popLayout">
          {isSettingsRoute ? (
            <motion.div
              animate="animate"
              className="flex flex-1 flex-col"
              exit="exit"
              initial="initial"
              key="settings"
              transition={TRANSITION}
              variants={settingsVariants}
            >
              <NavSettings slug={slug} />
            </motion.div>
          ) : (
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
                <SidebarOnboarding />
                <SidebarUpgrade />
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
