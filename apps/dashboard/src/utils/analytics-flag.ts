import { ANALYTICS_NAV_LINK } from "@/constants/analytics";
import type { NavMainItem } from "@/types/components/nav";

export function isAnalyticsVisibleInNav(flagOn: boolean): boolean {
  return flagOn || process.env.NODE_ENV === "development";
}

export function filterAnalyticsNavItems(
  items: NavMainItem[],
  analyticsVisible: boolean
): NavMainItem[] {
  if (analyticsVisible) {
    return items;
  }
  return items.filter((item) => item.link !== ANALYTICS_NAV_LINK);
}
