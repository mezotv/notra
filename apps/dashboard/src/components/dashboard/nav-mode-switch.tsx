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
import { SIDEBAR_MODE_HOME_LINKS, SIDEBAR_MODES } from "@/constants/nav";
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
      <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-sidebar-accent p-0.5 group-data-[collapsible=icon]:hidden">
        {SIDEBAR_MODES.map((option) => {
          const isActive = option.id === mode;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs transition-colors",
                isActive
                  ? "bg-background font-medium text-foreground ring-1 ring-border"
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
