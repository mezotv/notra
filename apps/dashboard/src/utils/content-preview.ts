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
