"use client";

import { Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  useHotkey("D", handleToggle);

  let ariaLabel = "Toggle theme";
  if (mounted && isDark) {
    ariaLabel = "Switch to light mode";
  } else if (mounted) {
    ariaLabel = "Switch to dark mode";
  }

  return (
    <Button
      aria-label={ariaLabel}
      className="text-foreground h-9 w-9 rounded-lg p-0"
      onClick={handleToggle}
      type="button"
      variant="ghost"
    >
      {mounted ? (
        <HugeiconsIcon
          className="size-4"
          icon={isDark ? Sun02Icon : Moon02Icon}
        />
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
