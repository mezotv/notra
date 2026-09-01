import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/constants/nav";

export function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

export function getSidebarWidthFromCookie(cookieValue?: string) {
  if (!cookieValue) {
    return SIDEBAR_DEFAULT_WIDTH;
  }

  const width = Number(cookieValue);
  return Number.isFinite(width) &&
    width >= SIDEBAR_MIN_WIDTH &&
    width <= SIDEBAR_MAX_WIDTH
    ? width
    : SIDEBAR_DEFAULT_WIDTH;
}
