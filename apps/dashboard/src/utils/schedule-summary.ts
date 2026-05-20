import { DAY_NAMES_LONG } from "@/constants/schedule";
import type { ScheduleCron } from "@/types/automation/schedule";
import { padTimeUnit } from "@/utils/schedule-form";

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${padTimeUnit(minute)} ${period}`;
}

export function formatScheduleSummary(value: ScheduleCron): string {
  const time = formatTime(value.hour, value.minute);
  if (value.frequency === "weekly") {
    const day = DAY_NAMES_LONG[value.dayOfWeek ?? 1];
    return `Every ${day} at ${time}`;
  }
  if (value.frequency === "monthly") {
    const day = value.dayOfMonth ?? 1;
    return `Monthly on day ${day} at ${time}`;
  }
  return `Every day at ${time}`;
}

export function computeNextRun(
  value: ScheduleCron,
  now: Date = new Date()
): Date {
  const next = new Date(now);
  next.setUTCSeconds(0, 0);

  if (value.frequency === "daily") {
    next.setUTCHours(value.hour, value.minute, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next;
  }

  if (value.frequency === "weekly") {
    const targetDay = value.dayOfWeek ?? 1;
    next.setUTCHours(value.hour, value.minute, 0, 0);
    const currentDay = next.getUTCDay();
    let dayDelta = targetDay - currentDay;
    if (dayDelta < 0 || (dayDelta === 0 && next.getTime() <= now.getTime())) {
      dayDelta += 7;
    }
    next.setUTCDate(next.getUTCDate() + dayDelta);
    return next;
  }

  const targetDay = value.dayOfMonth ?? 1;
  next.setUTCDate(1);
  next.setUTCHours(value.hour, value.minute, 0, 0);

  for (let i = 0; i < 13; i++) {
    const lastDayOfMonth = new Date(
      Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
    ).getUTCDate();
    if (targetDay <= lastDayOfMonth) {
      const candidate = new Date(next);
      candidate.setUTCDate(targetDay);
      if (candidate.getTime() > now.getTime()) {
        return candidate;
      }
    }
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

export function formatNextRunRelative(
  nextRun: Date,
  now: Date = new Date()
): string {
  const diffMs = nextRun.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "any moment";
  }
  if (diffMinutes < 60) {
    return `in ${diffMinutes}m`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `in ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `in ${diffDays}d`;
}

export function formatNextRunDate(nextRun: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(nextRun);
}

export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
