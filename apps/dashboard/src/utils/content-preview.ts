import { formatDistanceToNowStrict } from "date-fns";
import type { PrSelection, ReleaseSelection } from "@/types/content/preview";

export function prSelectionToKey(selection: PrSelection): string {
  return JSON.stringify([selection.repositoryId, selection.number]);
}

export function prSelectionFromKey(key: string): PrSelection | null {
  try {
    const parsed = JSON.parse(key);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "number"
    ) {
      return { repositoryId: parsed[0], number: parsed[1] };
    }
  } catch {
    return null;
  }
  return null;
}

export function releaseSelectionToKey(selection: ReleaseSelection): string {
  return JSON.stringify([selection.repositoryId, selection.tagName]);
}

export function releaseSelectionFromKey(key: string): ReleaseSelection | null {
  try {
    const parsed = JSON.parse(key);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string"
    ) {
      return { repositoryId: parsed[0], tagName: parsed[1] };
    }
  } catch {
    return null;
  }
  return null;
}

const MARKDOWN_PREVIEW_MAX_LENGTH = 200;
const MARKDOWN_PREVIEW_LINES = 3;
const DASHBOARD_POST_PREVIEW_MAX_LENGTH = 160;
const DASHBOARD_POST_PREVIEW_LINES = 2;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\([^)]+\)/g;

export function getMarkdownPreview(markdown: string): string {
  const lines = markdown
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.trim().length > 0);

  return lines
    .slice(0, MARKDOWN_PREVIEW_LINES)
    .join(" ")
    .trim()
    .replaceAll("**", "")
    .replaceAll("*", "")
    .replaceAll("`", "")
    .replace(MARKDOWN_LINK_REGEX, "$1")
    .slice(0, MARKDOWN_PREVIEW_MAX_LENGTH);
}

export function getDashboardPostPreview(markdown: string): string {
  const lines = markdown
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.trim().length > 0);

  return lines
    .slice(0, DASHBOARD_POST_PREVIEW_LINES)
    .join(" ")
    .trim()
    .replaceAll("**", "")
    .replaceAll("*", "")
    .replaceAll("`", "")
    .replace(MARKDOWN_LINK_REGEX, "$1")
    .slice(0, DASHBOARD_POST_PREVIEW_MAX_LENGTH);
}

export function getPageNumbers(
  current: number,
  total: number
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  if (current > 3) {
    pages.push("ellipsis");
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push("ellipsis");
  }
  pages.push(total);
  return pages;
}

export function formatLongDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "";
  }
}

export function formatRelativeDate(dateString: string): string {
  return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
}

export function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
