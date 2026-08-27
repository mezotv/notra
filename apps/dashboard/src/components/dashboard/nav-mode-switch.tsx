"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";

import {
  SIDEBAR_MODE_HOME_LINKS,
  SIDEBAR_MODE_PILL_CLASS,
  SIDEBAR_MODES,
} from "@/constants/nav";
import type { NavModeSwitchProps } from "@/types/components/nav";
import { geoNavHref } from "@/utils/geo-paths";

import { SidebarLabel } from "./sidebar-label";

export function NavModeSwitch({
  mode,
  slug,
  projectId,
  onModeChange,
}: NavModeSwitchProps) {
  return (
    <SidebarGroup className="pt-0">
      <div className="bg-sidebar-accent rounded-lg p-0.5 group-data-[collapsible=icon]:hidden">
        <div className="relative grid grid-cols-2">
          <div
            aria-hidden
            className={cn(
              SIDEBAR_MODE_PILL_CLASS,
              mode === "studio" && "translate-x-full"
            )}
          />
          {SIDEBAR_MODES.map((option) => {
            const isActive = option.id === mode;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative z-10 flex h-7 items-center justify-center gap-1.5 rounded-md text-xs transition-colors duration-150",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                href={geoNavHref(
                  slug,
                  SIDEBAR_MODE_HOME_LINKS[option.id],
                  projectId
                )}
                key={option.id}
                onClick={() => onModeChange(option.id)}
                prefetch
              >
                <HugeiconsIcon className="size-3.5" icon={option.icon} />
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        {SIDEBAR_MODES.map((option) => (
          <SidebarMenuItem key={option.id}>
            <SidebarMenuButton
              isActive={option.id === mode}
              render={
                <Link
                  href={geoNavHref(
                    slug,
                    SIDEBAR_MODE_HOME_LINKS[option.id],
                    projectId
                  )}
                  onClick={() => onModeChange(option.id)}
                >
                  <HugeiconsIcon icon={option.icon} />
                  <SidebarLabel>{option.label}</SidebarLabel>
                </Link>
              }
              tooltip={`${option.label} mode`}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
