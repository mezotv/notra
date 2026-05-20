"use client";

import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { cn } from "@notra/ui/lib/utils";
import { DAYS_OF_MONTH, DAYS_OF_WEEK } from "@/constants/schedule";
import type { ScheduleDayPickerProps } from "@/types/automation/schedule";

export function ScheduleDayPicker({
  frequency,
  dayOfWeek,
  dayOfMonth,
  onDayOfWeekChange,
  onDayOfMonthChange,
}: ScheduleDayPickerProps) {
  if (frequency === "daily") {
    return null;
  }

  if (frequency === "weekly") {
    const selectedDay = dayOfWeek ?? 1;
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Day of week</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = day.value === selectedDay;
            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "h-10 min-w-12 rounded-lg border px-3 font-medium text-sm transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                key={day.value}
                onClick={() => onDayOfWeekChange(day.value)}
                type="button"
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedMonthDay = dayOfMonth ?? 1;
  const isShortMonthDay = selectedMonthDay >= 29;
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs" htmlFor="day-of-month">
        Day of month
      </Label>
      <Select
        onValueChange={(val) => {
          if (val) {
            onDayOfMonthChange(Number.parseInt(val, 10));
          }
        }}
        value={String(selectedMonthDay)}
      >
        <SelectTrigger className="w-full sm:w-40" id="day-of-month">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {DAYS_OF_MONTH.map((day) => (
            <SelectItem key={day} value={String(day)}>
              Day {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">
        {isShortMonthDay
          ? `Months without day ${selectedMonthDay} are skipped (e.g. February).`
          : "If a month is shorter than the selected day, the run is skipped that month."}
      </p>
    </div>
  );
}
