import type { LookbackWindow } from "@/schemas/integrations";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface LookbackRange {
  start: Date;
  end: Date;
  label: string;
}

function isValidTimeZone(timeZone: string | undefined): timeZone is string {
  if (!timeZone) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    lookup("year"),
    lookup("month") - 1,
    lookup("day"),
    lookup("hour"),
    lookup("minute"),
    lookup("second")
  );

  return asUtc - date.getTime();
}

function startOfUtcDay(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function startOfDayInTimeZone(date: Date, timeZone: string): Date {
  const offset = getTimeZoneOffsetMs(date, timeZone);
  const localMidnight = new Date(date.getTime() + offset);
  localMidnight.setUTCHours(0, 0, 0, 0);

  const candidate = new Date(localMidnight.getTime() - offset);
  const adjustedOffset = getTimeZoneOffsetMs(candidate, timeZone);
  return new Date(localMidnight.getTime() - adjustedOffset);
}

export function resolveLookbackRange(
  window: LookbackWindow,
  timeZone?: string
): LookbackRange {
  const now = new Date();
  const zone = isValidTimeZone(timeZone) ? timeZone : undefined;
  const zoneLabel = zone ?? "UTC";
  const startOfDay = (date: Date) =>
    zone ? startOfDayInTimeZone(date, zone) : startOfUtcDay(date);

  if (window === "current_day") {
    return {
      start: startOfDay(now),
      end: now,
      label: `current day (${zoneLabel})`,
    };
  }

  if (window === "yesterday") {
    const todayStart = startOfDay(now);
    return {
      start: startOfDay(new Date(now.getTime() - DAY_IN_MS)),
      end: todayStart,
      label: `previous day (${zoneLabel})`,
    };
  }

  if (window === "last_14_days") {
    return {
      start: new Date(now.getTime() - 14 * DAY_IN_MS),
      end: now,
      label: "last 14 days (rolling)",
    };
  }

  if (window === "last_30_days") {
    return {
      start: new Date(now.getTime() - 30 * DAY_IN_MS),
      end: now,
      label: "last 30 days (rolling)",
    };
  }

  if (window === "last_7_days") {
    return {
      start: new Date(now.getTime() - 7 * DAY_IN_MS),
      end: now,
      label: "last 7 days (rolling)",
    };
  }

  const _exhaustive: never = window;
  return {
    start: new Date(now.getTime() - 7 * DAY_IN_MS),
    end: now,
    label: "last 7 days (rolling)",
  };
}

export function formatTodayContext(now: Date, timeZone?: string): string {
  const zone = isValidTimeZone(timeZone) ? timeZone : undefined;

  if (!zone) {
    const weekday = WEEKDAYS[now.getUTCDay()];
    return `${weekday}, ${now.toISOString().slice(0, 10)} (UTC)`;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("weekday")}, ${get("year")}-${get("month")}-${get("day")} (${zone})`;
}
