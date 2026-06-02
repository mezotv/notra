"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";
import {
  type FrostGlassVariantProp,
  glassVariantStyles,
} from "@notra/ui/lib/glass-variants";
import { cn } from "@notra/ui/lib/utils";
import { DropdownMenuContent } from "../dropdown-menu";
import { LiquidGlass } from "./liquid-glass";

type GlassDropdownMenuContentProps = React.ComponentProps<
  typeof DropdownMenuContent
> &
  FrostGlassVariantProp & {
    glassClassName?: string;
  };

const menuStateStyles = [
  "[&_[data-slot=dropdown-menu-item]:focus]:bg-white/70",
  "[&_[data-slot=dropdown-menu-item]:focus]:text-black",
  "dark:[&_[data-slot=dropdown-menu-item]:focus]:bg-white/12",
  "dark:[&_[data-slot=dropdown-menu-item]:focus]:text-white",
  "[&_[data-slot=dropdown-menu-checkbox-item]:focus]:bg-white/70",
  "[&_[data-slot=dropdown-menu-checkbox-item]:focus]:text-black",
  "dark:[&_[data-slot=dropdown-menu-checkbox-item]:focus]:bg-white/12",
  "dark:[&_[data-slot=dropdown-menu-checkbox-item]:focus]:text-white",
  "[&_[data-slot=dropdown-menu-sub-trigger]:focus]:bg-white/70",
  "[&_[data-slot=dropdown-menu-sub-trigger]:focus]:text-black",
  "dark:[&_[data-slot=dropdown-menu-sub-trigger]:focus]:bg-white/12",
  "dark:[&_[data-slot=dropdown-menu-sub-trigger]:focus]:text-white",
  "[&_[data-slot=dropdown-menu-separator]]:bg-white/25",
  "dark:[&_[data-slot=dropdown-menu-separator]]:bg-white/10",
].join(" ");

function GlassDropdownMenuContent({
  className,
  glassClassName,
  glassVariant = "liquid-refract",
  showBackdrop = false,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: GlassDropdownMenuContentProps) {
  if (glassVariant === "liquid-refract") {
    return (
      <MenuPrimitive.Portal>
        {showBackdrop ? (
          <MenuPrimitive.Backdrop
            className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-40 bg-black/8 duration-100 dark:bg-black/30"
            data-slot="dropdown-menu-backdrop"
          />
        ) : null}
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          className="isolate z-50 outline-none"
          side={side}
          sideOffset={sideOffset}
        >
          <LiquidGlass className={cn("rounded-lg", glassClassName)}>
            <MenuPrimitive.Popup
              className={cn(
                "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-transparent p-1 text-foreground shadow-none outline-none ring-0 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:overflow-hidden",
                menuStateStyles,
                className
              )}
              data-glass-variant={glassVariant}
              data-slot="glass-dropdown-menu-content"
              {...props}
            />
          </LiquidGlass>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    );
  }

  return (
    <DropdownMenuContent
      align={align}
      alignOffset={alignOffset}
      className={cn(
        glassVariantStyles[glassVariant],
        "border border-white/30 bg-white/60 text-foreground shadow-2xl ring-1 ring-white/20 dark:border-white/10 dark:bg-black/55 dark:ring-white/10",
        menuStateStyles,
        className
      )}
      data-glass-variant={glassVariant}
      data-slot="glass-dropdown-menu-content"
      showBackdrop={showBackdrop}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export { GlassDropdownMenuContent };
