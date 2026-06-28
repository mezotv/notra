"use client";

import { domMax, LazyMotion, m } from "motion/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";
import { cn } from "@notra/ui/lib/utils";

type PermissionTone = "neutral" | "success" | "danger" | "warning";

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

interface PermissionRowContextValue {
  value: string | undefined;
  select: (value: string) => void;
  layoutId: string;
  disabled: boolean;
}

const PermissionRowContext = createContext<PermissionRowContextValue | null>(
  null
);

function usePermissionRow() {
  const context = useContext(PermissionRowContext);
  if (!context) {
    throw new Error("PermissionOption must be used within a PermissionRow");
  }
  return context;
}

interface PermissionSelectorProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

function PermissionSelector({
  children,
  label = "Permissions",
  className,
}: PermissionSelectorProps) {
  return (
    <fieldset
      className={cn(
        "w-full divide-y overflow-hidden rounded-xl border bg-background",
        className
      )}
    >
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

interface PermissionRowProps {
  children: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function PermissionRow({
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
            role="radiogroup"
          >
            {children}
          </div>
        </div>
      </LazyMotion>
    </PermissionRowContext.Provider>
  );
}

interface PermissionOptionProps {
  value: string;
  children: ReactNode;
  tone?: PermissionTone;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function PermissionOption({
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
  const disabled = optionDisabled ?? rowDisabled;

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

export { PermissionSelector, PermissionRow, PermissionOption };
export type {
  PermissionSelectorProps,
  PermissionRowProps,
  PermissionOptionProps,
  PermissionTone,
};
