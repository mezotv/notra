import {
  SCHEDULE_ANCHOR_DATE_PATTERN,
  SCHEDULE_DAY_MS,
} from "../constants/schedule-interval";
import type { CustomIntervalCron } from "../types/schedule-interval";

const MINUTE_MS = 60 * 1000;

export function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parses a `YYYY-MM-DD` string to UTC midnight, or `null` when malformed. */
export function parseUtcDate(value: string): Date | null {
  if (!SCHEDULE_ANCHOR_DATE_PATTERN.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function utcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / SCHEDULE_DAY_MS);
}

/**
 * Whether an "every N days" schedule is due for the tick that most recently
 * passed `hour:minute` UTC at or before `now`. Shifting `now` back by the
 * scheduled time of day means a delivery that arrives late — even past
 * midnight — is still attributed to the day it was scheduled for.
 *
 * Every N days is not expressible in cron (`* /N` resets at month
 * boundaries), so the QStash schedule fires daily and this gate decides.
 */
export function isCustomIntervalDue(
  cron: CustomIntervalCron,
  now: Date = new Date()
): boolean {
  const anchor = parseUtcDate(cron.anchorDate);
  if (!anchor || cron.intervalDays < 1) {
    return true;
  }
  const shifted = new Date(
    now.getTime() - (cron.hour * 60 + cron.minute) * MINUTE_MS
  );
  const dayIndex = daysBetween(anchor, utcMidnight(shifted));
  return dayIndex >= 0 && dayIndex % cron.intervalDays === 0;
}

/** Next `hour:minute` UTC occurrence that lands on an interval day. */
export function nextCustomIntervalRun(
  cron: CustomIntervalCron,
  now: Date = new Date()
): Date {
  const candidate = utcMidnight(now);
  candidate.setUTCHours(cron.hour, cron.minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  const anchor = parseUtcDate(cron.anchorDate);
  if (!anchor || cron.intervalDays < 1) {
    return candidate;
  }

  const dayIndex = daysBetween(anchor, utcMidnight(candidate));
  if (dayIndex < 0) {
    const first = new Date(anchor);
    first.setUTCHours(cron.hour, cron.minute, 0, 0);
    return first;
  }
  const offset =
    (cron.intervalDays - (dayIndex % cron.intervalDays)) % cron.intervalDays;
  candidate.setUTCDate(candidate.getUTCDate() + offset);
  return candidate;
}
