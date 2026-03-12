import type {
  ContentDataPointSettings,
  OnDemandContentType,
} from "@/schemas/content";
import type { EventType } from "@/types/content/preview";

export const GITHUB_API_PAGE_SIZE = 100;
export const GITHUB_API_MAX_PAGES = 50;
export const GITHUB_API_MAX_RESULTS = 500;

export const EVENTS_PER_PAGE = 50;

export const DEFAULT_CONTENT_TYPE: OnDemandContentType = "changelog";

export const DEFAULT_DATA_POINTS: ContentDataPointSettings = {
  includePullRequests: true,
  includeCommits: true,
  includeReleases: true,
  includeLinearIssues: false,
};

export const EVENT_BADGE: Record<EventType, string> = {
  Release: "bg-green-600 text-white border-transparent",
  PR: "bg-blue-600 text-white border-transparent",
  Commit: "bg-orange-600 text-white border-transparent",
};
