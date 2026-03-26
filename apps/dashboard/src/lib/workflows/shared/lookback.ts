import { DAY_IN_MS, UTC_WEEKDAYS } from "@/constants/workflows";
import type { LookbackWindow } from "@/schemas/integrations";

export function resolveLookbackRange(window: LookbackWindow) {
  const now = new Date();

  if (window === "current_day") {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);

    return {
      start,
      end: now,
      label: "current UTC day",
    };
  }

  if (window === "yesterday") {
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - DAY_IN_MS);

    return {
      start,
      end,
      label: "previous UTC day",
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

  return {
    start: new Date(now.getTime() - 7 * DAY_IN_MS),
    end: now,
    label: "last 7 days (rolling)",
  };
}

export function formatUtcTodayContext(now: Date) {
  const weekday = UTC_WEEKDAYS[now.getUTCDay()];
  const date = now.toISOString().slice(0, 10);

  return `${weekday}, ${date} (UTC)`;
}
