import {
  CURSOR_TOOLTIP_EDGE_PX,
  TOP_POST_CONTENT_PREVIEW_LENGTH,
} from "@/constants/analytics";
import type {
  AccountSeriesRow,
  AnalyticsHeroSummary,
  BestPostingSlot,
  CursorTipState,
  EngagementTimeseriesPoint,
  FollowerGrowthPoint,
  LeaderboardDetailMetric,
  NotraAdoptionResponse,
  PostingActivityLevel,
  PostingHeatmapCell,
  PostingPerformancePoint,
  PostingTimeSlot,
  SocialOverviewAccount,
} from "@/types/analytics";
import type { ChartMarker } from "@/types/charts";
import { chartKey } from "@/utils/chart-keys";

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatMetric(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return compactFormatter.format(value);
}

export function formatDayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }
  return dayLabelFormatter.format(date);
}

export function accountSeriesKey(
  provider: string,
  providerAccountId: string
): string {
  return chartKey(`${provider}-${providerAccountId}`);
}

export function buildAccountSeriesRows(
  timelineDays: string[],
  accountKeys: string[],
  points: EngagementTimeseriesPoint[],
  metric: (point: EngagementTimeseriesPoint) => number
): AccountSeriesRow[] {
  const valuesByDay = new Map<string, Map<string, number>>();
  for (const point of points) {
    const key = accountSeriesKey(point.provider, point.providerAccountId);
    const dayValues = valuesByDay.get(point.day) ?? new Map<string, number>();
    dayValues.set(key, (dayValues.get(key) ?? 0) + metric(point));
    valuesByDay.set(point.day, dayValues);
  }

  return timelineDays.map((day) => {
    const row: AccountSeriesRow = { day: formatDayLabel(day), rawDay: day };
    const dayValues = valuesByDay.get(day);
    for (const key of accountKeys) {
      row[key] = dayValues?.get(key) ?? 0;
    }
    return row;
  });
}

function markerLabelForDate(
  timelineDays: string[],
  isoDate: string | null
): string | null {
  if (!isoDate) {
    return null;
  }
  const day = isoDate.slice(0, 10);
  const first = timelineDays.at(0);
  const last = timelineDays.at(-1);
  if (!(first && last) || day > last) {
    return null;
  }
  if (day < first) {
    return null;
  }
  const index = timelineDays.indexOf(day);
  return index === -1 ? null : formatDayLabel(day);
}

export function sumMetric(
  accounts: SocialOverviewAccount[],
  metric: (account: SocialOverviewAccount) => number | null
): number | null {
  let total: number | null = null;
  for (const account of accounts) {
    const value = metric(account);
    if (value !== null) {
      total = (total ?? 0) + value;
    }
  }
  return total;
}

const HOURS_IN_DAY = 24;
const HIGH_ACTIVITY_SHARE = 0.75;
const MEDIUM_ACTIVITY_SHARE = 0.4;

function postingActivityLevel(
  avgEngagement: number,
  maxAvgEngagement: number
): PostingActivityLevel {
  if (avgEngagement <= 0 || maxAvgEngagement <= 0) {
    return "quiet";
  }
  const share = avgEngagement / maxAvgEngagement;
  if (share >= HIGH_ACTIVITY_SHARE) {
    return "high";
  }
  if (share >= MEDIUM_ACTIVITY_SHARE) {
    return "medium";
  }
  return "low";
}

export function buildPostingTimeSlots(
  points: PostingPerformancePoint[],
  weekday: number | null = null
): PostingTimeSlot[] {
  const source =
    weekday === null
      ? points
      : points.filter((point) => point.weekday === weekday);
  const totals = new Map<number, { posts: number; engagement: number }>();
  for (const point of source) {
    const entry = totals.get(point.hour) ?? { posts: 0, engagement: 0 };
    entry.posts += point.posts;
    entry.engagement += point.engagement;
    totals.set(point.hour, entry);
  }
  const slots = Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
    const entry = totals.get(hour);
    const posts = entry?.posts ?? 0;
    return {
      hour,
      posts,
      avgEngagement: entry && posts > 0 ? entry.engagement / posts : 0,
    };
  });
  const maxAvgEngagement = slots.reduce(
    (max, slot) => Math.max(max, slot.avgEngagement),
    0
  );
  return slots.map((slot) => ({
    ...slot,
    level: postingActivityLevel(slot.avgEngagement, maxAvgEngagement),
  }));
}

const MIN_BEST_SLOT_POSTS = 2;

const WEEKDAYS_IN_WEEK = 7;

export function buildPostingHeatmap(
  points: PostingPerformancePoint[]
): PostingHeatmapCell[][] {
  const totals = new Map<string, { posts: number; engagement: number }>();
  for (const point of points) {
    const key = `${point.weekday}-${point.hour}`;
    const entry = totals.get(key) ?? { posts: 0, engagement: 0 };
    entry.posts += point.posts;
    entry.engagement += point.engagement;
    totals.set(key, entry);
  }
  const cells = Array.from({ length: WEEKDAYS_IN_WEEK }, (_, dayIndex) =>
    Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
      const entry = totals.get(`${dayIndex + 1}-${hour}`);
      const posts = entry?.posts ?? 0;
      return {
        weekday: dayIndex + 1,
        hour,
        posts,
        avgEngagement: entry && posts > 0 ? entry.engagement / posts : 0,
      };
    })
  );
  const maxAvgEngagement = cells
    .flat()
    .reduce((max, cell) => Math.max(max, cell.avgEngagement), 0);
  return cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      level: postingActivityLevel(cell.avgEngagement, maxAvgEngagement),
    }))
  );
}

export function findBestPostingSlot(
  points: PostingPerformancePoint[],
  weekday: number | null = null
): BestPostingSlot | null {
  const source =
    weekday === null
      ? points
      : points.filter((point) => point.weekday === weekday);
  const sampled = source.filter((point) => point.posts >= MIN_BEST_SLOT_POSTS);
  const candidates = sampled.length > 0 ? sampled : source;
  let best: PostingPerformancePoint | null = null;
  for (const point of candidates) {
    if (point.posts === 0) {
      continue;
    }
    const beatsAverage =
      best === null || point.avgEngagement > best.avgEngagement;
    const breaksTie =
      best !== null &&
      point.avgEngagement === best.avgEngagement &&
      point.posts > best.posts;
    if (beatsAverage || breaksTie) {
      best = point;
    }
  }
  if (best === null) {
    return null;
  }
  return {
    weekday: WEEKDAY_LABELS[best.weekday - 1] ?? "",
    hour: best.hour,
    posts: best.posts,
    avgEngagement: best.avgEngagement,
  };
}

const HOUR_PAD_LENGTH = 2;

export function formatHourRange(hour: number): string {
  const label = String(hour).padStart(HOUR_PAD_LENGTH, "0");
  return `${label}:00 - ${label}:59`;
}

export function cursorTipPosition(event: {
  clientX: number;
  clientY: number;
}): Pick<CursorTipState, "x" | "y" | "flip"> {
  return {
    x: event.clientX,
    y: event.clientY,
    flip: event.clientX > window.innerWidth - CURSOR_TOOLTIP_EDGE_PX,
  };
}

export function timezoneAbbreviation(): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

const MIN_SLOT_HEIGHT_PERCENT = 12;
const MAX_SLOT_HEIGHT_PERCENT = 100;

export function postingSlotHeightPercent(
  avgEngagement: number,
  maxAvgEngagement: number
): number {
  if (maxAvgEngagement <= 0 || avgEngagement <= 0) {
    return MIN_SLOT_HEIGHT_PERCENT;
  }
  return (
    MIN_SLOT_HEIGHT_PERCENT +
    (MAX_SLOT_HEIGHT_PERCENT - MIN_SLOT_HEIGHT_PERCENT) *
      (avgEngagement / maxAvgEngagement)
  );
}

export function buildAdoptionMarkers(
  timelineDays: string[],
  adoption: NotraAdoptionResponse | undefined
): ChartMarker[] {
  const result: ChartMarker[] = [];
  const joined = markerLabelForDate(
    timelineDays,
    adoption?.organizationCreatedAt ?? null
  );
  if (joined !== null) {
    result.push({ value: joined, label: "Joined Notra" });
  }
  const firstPost = markerLabelForDate(
    timelineDays,
    adoption?.firstNotraPostAt ?? null
  );
  if (firstPost !== null && firstPost !== joined) {
    result.push({ value: firstPost, label: "First Notra post" });
  }
  return result;
}

const PERCENT = 100;

export function buildAnalyticsHeroSummary(
  accounts: SocialOverviewAccount[],
  points: EngagementTimeseriesPoint[]
): AnalyticsHeroSummary {
  const followers = sumMetric(accounts, (account) => account.followersCount);
  let impressions = 0;
  let interactions = 0;
  let posts = 0;
  for (const point of points) {
    impressions += point.impressions ?? 0;
    interactions +=
      (point.likes ?? 0) + (point.replies ?? 0) + (point.reposts ?? 0);
    posts += point.posts;
  }
  const engagementRate =
    impressions > 0 ? (interactions / impressions) * PERCENT : null;
  return { followers, impressions, interactions, posts, engagementRate };
}

const WHITESPACE_REGEX = /\s+/g;

export function previewPostContent(content: string): string {
  const singleLine = content.replace(WHITESPACE_REGEX, " ").trim();
  if (singleLine.length <= TOP_POST_CONTENT_PREVIEW_LENGTH) {
    return singleLine;
  }
  return `${singleLine.slice(0, TOP_POST_CONTENT_PREVIEW_LENGTH)}\u2026`;
}

export function leaderboardDetailMetrics(
  account: SocialOverviewAccount
): LeaderboardDetailMetric[] {
  const interactions =
    (account.likes ?? 0) + (account.replies ?? 0) + (account.reposts ?? 0);
  const engagementRate =
    account.impressions && account.impressions > 0
      ? `${((interactions / account.impressions) * PERCENT).toFixed(1)}%`
      : "N/A";
  return [
    { label: "Followers", value: formatMetric(account.followersCount) },
    { label: "Impressions", value: formatMetric(account.impressions) },
    { label: "Likes", value: formatMetric(account.likes) },
    { label: "Replies", value: formatMetric(account.replies) },
    { label: "Reposts", value: formatMetric(account.reposts) },
    { label: "Quotes", value: formatMetric(account.quotes) },
    { label: "Bookmarks", value: formatMetric(account.bookmarks) },
    { label: "Eng. rate", value: engagementRate },
  ];
}
