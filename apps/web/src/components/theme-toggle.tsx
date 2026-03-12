"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
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

  return (
    <Button
      aria-label={
        mounted
          ? isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle theme"
      }
      className="h-9 w-9 rounded-lg p-0 text-foreground"
      onClick={handleToggle}
      type="button"
      variant="ghost"
    >
      {mounted ? (
        <HugeiconsIcon
          className="size-4"
          icon={isDark ? Sun03Icon : Moon02Icon}
        />
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
