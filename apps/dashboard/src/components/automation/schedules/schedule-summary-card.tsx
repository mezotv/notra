"use client";

import { Calendar02Icon, Clock04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSyncExternalStore } from "react";

import type { ScheduleSummaryCardProps } from "@/types/automation/schedule";
import {
  computeNextRun,
  formatNextRunDate,
  formatNextRunRelative,
  formatScheduleSummary,
  getLocalTimezone,
} from "@/utils/schedule-summary";

const NOW_REFRESH_INTERVAL_MS = 60_000;
const nowListeners = new Set<() => void>();
let nowIntervalId: ReturnType<typeof setInterval> | null = null;
let currentNow: Date | null = null;

function subscribeToNow(listener: () => void) {
  nowListeners.add(listener);
  if (nowIntervalId === null) {
    currentNow = new Date();
    nowIntervalId = setInterval(() => {
      currentNow = new Date();
      for (const notify of nowListeners) {
        notify();
      }
    }, NOW_REFRESH_INTERVAL_MS);
  }
  return () => {
    nowListeners.delete(listener);
    if (nowListeners.size === 0 && nowIntervalId !== null) {
      clearInterval(nowIntervalId);
      nowIntervalId = null;
    }
  };
}

const getNowSnapshot = () => currentNow;
const getServerNowSnapshot = () => null;

export function ScheduleSummaryCard({ schedule }: ScheduleSummaryCardProps) {
  const now = useSyncExternalStore(
    subscribeToNow,
    getNowSnapshot,
    getServerNowSnapshot
  );

  const summary = formatScheduleSummary(schedule);

  if (!now) {
    return (
      <div className="bg-muted/30 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="text-muted-foreground size-4"
            icon={Calendar02Icon}
          />
          <p className="text-sm font-medium">{summary}</p>
        </div>
      </div>
    );
  }

  const nextRun = computeNextRun(schedule, now);
  const relative = formatNextRunRelative(nextRun, now);
  const formatted = formatNextRunDate(nextRun);
  const tz = getLocalTimezone();

  return (
    <div className="bg-muted/30 space-y-2 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="text-muted-foreground size-4"
          icon={Calendar02Icon}
        />
        <p className="text-sm font-medium">
          {summary}{" "}
          <span className="text-muted-foreground font-normal">
            &middot; UTC
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="text-muted-foreground size-4"
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
