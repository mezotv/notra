"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd, KbdGroup } from "@notra/ui/components/ui/kbd";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { NAV_SEARCH_LABEL, NAV_SEARCH_SHORTCUT_KEY } from "@/constants/nav";
import type { NavSearchProps } from "@/types/components/nav";
import { SidebarLabel } from "./sidebar-label";

export function NavSearch({ isApplePlatform, onOpen }: NavSearchProps) {
  return (
    <>
      <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
        <button
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border bg-background px-2 text-muted-foreground text-xs transition-colors hover:bg-muted/60 hover:text-foreground"
          onClick={onOpen}
          type="button"
        >
          <HugeiconsIcon className="size-3.5 shrink-0" icon={SearchIcon} />
          <span className="flex-1 truncate text-left">{NAV_SEARCH_LABEL}</span>
          <KbdGroup>
            <Kbd>{isApplePlatform ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>{NAV_SEARCH_SHORTCUT_KEY}</Kbd>
          </KbdGroup>
        </button>
      </SidebarGroup>
      <SidebarGroup className="hidden py-0 group-data-[collapsible=icon]:block">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="cursor-pointer"
              onClick={onOpen}
              tooltip={NAV_SEARCH_LABEL}
            >
              <HugeiconsIcon icon={SearchIcon} />
              <SidebarLabel>{NAV_SEARCH_LABEL}</SidebarLabel>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
