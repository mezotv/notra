"use client";

import { domMax, LazyMotion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@notra/ui/lib/utils";
import {
  PermissionRowContext,
  type PermissionRowContextValue,
} from "./permission-selector-context";

export interface PermissionRowProps {
  children: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PermissionRow({
  children,
  label,
  description,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
}: PermissionRowProps) {
  const layoutId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;

  const select = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  const context: PermissionRowContextValue = {
    value: activeValue,
    select,
    layoutId,
    disabled,
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(
        event.key
      )
    ) {
      return;
    }

    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not(:disabled)'
      )
    );
    if (!options.length) {
      return;
    }

    event.preventDefault();

    const currentIndex = Math.max(
      0,
      options.findIndex((option) => option === document.activeElement)
    );
    let nextIndex = (currentIndex + 1) % options.length;

    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }
    const nextOption = options[nextIndex];

    nextOption?.focus();
    nextOption?.click();
  };

  return (
    <PermissionRowContext.Provider value={context}>
      <LazyMotion features={domMax}>
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-3",
            className
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-foreground text-sm">{label}</span>
            {description && (
              <span className="text-muted-foreground text-xs">
                {description}
              </span>
            )}
          </div>
          <div
            aria-label={typeof label === "string" ? label : undefined}
            className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5"
            onKeyDown={handleKeyDown}
            role="radiogroup"
          >
            {children}
          </div>
        </div>
      </LazyMotion>
    </PermissionRowContext.Provider>
  );
}
