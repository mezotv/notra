"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { SidebarMenuButton, useSidebar } from "@notra/ui/components/ui/sidebar";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const mounted = resolvedTheme !== undefined;

  const isDark = resolvedTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <SidebarMenuButton>
        <div className="size-4" />
        {!isCollapsed && (
          <span className="text-sidebar-foreground flex-1 text-sm">
            Dark Mode
          </span>
        )}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton
      className="cursor-pointer"
      onClick={handleToggle}
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
  );
}
