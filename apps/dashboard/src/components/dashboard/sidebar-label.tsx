"use client";

import { useSidebar } from "@notra/ui/components/ui/sidebar";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SidebarLabelProps } from "@/types/components/sidebar-label";

const LETTER_DURATION_MS = 150;
const STAGGER_CAP_MS = 140;

export function SidebarLabel({ children, className }: SidebarLabelProps) {
  const { state, isMobile } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const collapsed = state === "collapsed" && !isMobile;
  const chars = Array.from(children);
  const staggerMs =
    chars.length > 1 ? Math.min(14, STAGGER_CAP_MS / (chars.length - 1)) : 0;

  return (
    <span className={cn("min-w-0 whitespace-nowrap", className)}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" data-slot="sidebar-label">
        {chars.map((char, index) => {
          const delayMs = collapsed
            ? (chars.length - 1 - index) * staggerMs
            : index * staggerMs;

          return (
            <span
              className="inline-block"
              key={`${children}-${char}-${index.toString()}`}
              style={{
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "translateX(2px)" : "translateX(0)",
                transitionProperty: shouldReduceMotion
                  ? "none"
                  : "opacity, transform",
                transitionDuration: shouldReduceMotion
                  ? "0ms"
                  : `${LETTER_DURATION_MS}ms`,
                transitionDelay: shouldReduceMotion ? "0ms" : `${delayMs}ms`,
                transitionTimingFunction:
                  "var(--sidebar-ease, cubic-bezier(0.22, 1, 0.36, 1))",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
