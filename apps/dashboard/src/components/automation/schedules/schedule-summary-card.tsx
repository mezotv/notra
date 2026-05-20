"use client";

import { Calendar02Icon, Clock04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { ScheduleSummaryCardProps } from "@/types/automation/schedule";
import {
  computeNextRun,
  formatNextRunDate,
  formatNextRunRelative,
  formatScheduleSummary,
  getLocalTimezone,
} from "@/utils/schedule-summary";

export function ScheduleSummaryCard({ schedule }: ScheduleSummaryCardProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const summary = formatScheduleSummary(schedule);

  if (!now) {
    return (
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="size-4 text-muted-foreground"
            icon={Calendar02Icon}
          />
          <p className="font-medium text-sm">{summary}</p>
        </div>
      </div>
    );
  }

  const nextRun = computeNextRun(schedule, now);
  const relative = formatNextRunRelative(nextRun, now);
  const formatted = formatNextRunDate(nextRun);
  const tz = getLocalTimezone();

  return (
    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Calendar02Icon}
        />
        <p className="font-medium text-sm">
          {summary}{" "}
          <span className="font-normal text-muted-foreground">
            &middot; UTC
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Clock04Icon}
        />
        <p className="text-muted-foreground text-sm">
          Next run: {formatted} ({relative}) &middot;{" "}
          <span className="text-muted-foreground/80">{tz}</span>
        </p>
      </div>
    </div>
  );
}
