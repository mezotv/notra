"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarMenuButton, useSidebar } from "@notra/ui/components/ui/sidebar";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isDark = resolvedTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
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
        <span className="flex-1 text-left text-sm">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </SidebarMenuButton>
  );
}
