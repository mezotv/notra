"use client";

import { cn } from "@notra/ui/lib/utils";
import { useLayoutEffect, useState } from "react";

import {
  SIDEBAR_MODE_ENTER_CLASS,
  SIDEBAR_MODE_EXIT_LEFT_CLASS,
  SIDEBAR_MODE_EXIT_MS,
  SIDEBAR_MODE_EXIT_RIGHT_CLASS,
  SIDEBAR_MODE_PANEL_CLASS,
} from "@/constants/nav";
import type {
  SidebarSwapItem,
  SidebarSwapProps,
  SidebarSwapSide,
} from "@/types/components/nav";

function panelClassName(
  shown: boolean,
  side: SidebarSwapSide,
  className?: string
) {
  const exitClass =
    side === "left"
      ? SIDEBAR_MODE_EXIT_LEFT_CLASS
      : SIDEBAR_MODE_EXIT_RIGHT_CLASS;

  return cn(
    SIDEBAR_MODE_PANEL_CLASS,
    shown
      ? `relative ${SIDEBAR_MODE_ENTER_CLASS}`
      : `absolute inset-x-0 top-0 ${exitClass}`,
    className
  );
}

function SidebarSwapLayer({
  shown,
  side,
  className,
  children,
}: {
  shown: boolean;
  side: SidebarSwapSide;
  className?: string;
  children: SidebarSwapItem["children"];
}) {
  return (
    <div
      aria-hidden={!shown}
      className={panelClassName(shown, side, className)}
      inert={shown ? undefined : true}
    >
      {children}
    </div>
  );
}

function EphemeralSidebarSwapPanel({
  active,
  side,
  skipEnter,
  className,
  children,
}: {
  active: boolean;
  side: SidebarSwapSide;
  skipEnter: boolean;
  className?: string;
  children: SidebarSwapItem["children"];
}) {
  const [mounted, setMounted] = useState(active);
  const [shown, setShown] = useState(active && skipEnter);

  if (active && !mounted) {
    setMounted(true);
  }

  useLayoutEffect(() => {
    if (active) {
      setMounted(true);
      if (skipEnter) {
        setShown(true);
        return;
      }
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setShown(false);
    const timeout = window.setTimeout(
      () => setMounted(false),
      SIDEBAR_MODE_EXIT_MS
    );
    return () => window.clearTimeout(timeout);
  }, [active, skipEnter]);

  if (!mounted) {
    return null;
  }

  return (
    <SidebarSwapLayer className={className} shown={shown} side={side}>
      {children}
    </SidebarSwapLayer>
  );
}

export function SidebarSwap({
  activeId,
  items,
  keepMounted = false,
  className,
}: SidebarSwapProps) {
  const [initialId] = useState(activeId);
  const [hasSwapped, setHasSwapped] = useState(false);

  if (!hasSwapped && activeId !== initialId) {
    setHasSwapped(true);
  }

  return (
    <div className={cn("relative", className)}>
      {items.map((item) => {
        const active = item.id === activeId;
        const skipEnter = !hasSwapped && item.id === initialId;

        if (keepMounted) {
          return (
            <SidebarSwapLayer
              className={item.className}
              key={item.id}
              shown={active}
              side={item.side}
            >
              {item.children}
            </SidebarSwapLayer>
          );
        }

        return (
          <EphemeralSidebarSwapPanel
            active={active}
            className={item.className}
            key={item.id}
            side={item.side}
            skipEnter={skipEnter}
          >
            {item.children}
          </EphemeralSidebarSwapPanel>
        );
      })}
    </div>
  );
}
