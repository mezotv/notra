"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const mounted = resolvedTheme !== undefined;
  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  useHotkey("D", toggleTheme, { enabled: mounted });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {mounted ? (
          <SidebarMenuButton
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="cursor-pointer"
            onClick={toggleTheme}
            tooltip={isDark ? "Light Mode" : "Dark Mode"}
          >
            <HugeiconsIcon
              className="size-4"
              icon={isDark ? Sun03Icon : Moon02Icon}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm">
                  {isDark ? "Light Mode" : "Dark Mode"}
                </span>
                <Kbd className="ml-auto">D</Kbd>
              </>
            )}
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton aria-label="Change color theme">
            <div className="size-4" />
            {!isCollapsed && (
              <span className="flex-1 text-left text-sm">Dark Mode</span>
            )}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
