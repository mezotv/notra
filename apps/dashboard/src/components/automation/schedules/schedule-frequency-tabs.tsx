"use client";

import { cn } from "@notra/ui/lib/utils";
import { FREQUENCY_OPTIONS } from "@/constants/schedule";
import type { ScheduleFrequencyTabsProps } from "@/types/automation/schedule";

export function ScheduleFrequencyTabs({
  value,
  onChange,
}: ScheduleFrequencyTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FREQUENCY_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "h-10 rounded-lg border px-3 font-medium text-sm transition-all",
              isActive
                ? "border-foreground bg-muted font-semibold text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
