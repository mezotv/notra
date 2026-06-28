"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@notra/ui/lib/utils";
import {
  type PermissionTone,
  usePermissionRow,
} from "./permission-selector-context";

const SPRING = { type: "spring", bounce: 0.2, duration: 0.4 } as const;

const TONE_TEXT: Record<PermissionTone, string> = {
  neutral: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-destructive",
  warning: "text-amber-600 dark:text-amber-500",
};

const TONE_PILL: Record<PermissionTone, string> = {
  neutral: "bg-background ring-border",
  success: "bg-emerald-500/10 ring-emerald-500/30",
  danger: "bg-destructive/10 ring-destructive/30",
  warning: "bg-amber-500/10 ring-amber-500/30",
};

export interface PermissionOptionProps {
  value: string;
  children: ReactNode;
  tone?: PermissionTone;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function PermissionOption({
  value,
  children,
  tone = "neutral",
  disabled: optionDisabled,
  className,
  "aria-label": ariaLabel,
}: PermissionOptionProps) {
  const {
    value: selected,
    select,
    layoutId,
    disabled: rowDisabled,
  } = usePermissionRow();
  const active = selected === value;
  const disabled = rowDisabled || (optionDisabled ?? false);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a single-select segmented control is the radiogroup/radio ARIA pattern; native radios can't hold custom pill content.
    <button
      aria-checked={active}
      aria-label={ariaLabel}
      className={cn(
        "relative flex min-w-7 cursor-pointer items-center justify-center rounded-md px-2.5 py-1 font-medium text-sm outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:size-4",
        active
          ? TONE_TEXT[tone]
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      disabled={disabled}
      onClick={() => select(value)}
      role="radio"
      tabIndex={selected === undefined || active ? 0 : -1}
      type="button"
    >
      {active && (
        <m.span
          className={cn(
            "absolute inset-0 rounded-md shadow-sm ring-1",
            TONE_PILL[tone]
          )}
          layoutId={layoutId}
          transition={SPRING}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {children}
      </span>
    </button>
  );
}
