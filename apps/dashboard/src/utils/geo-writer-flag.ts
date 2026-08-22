import { GEO_GAPS_NAV_LINK, GEO_WRITER_NAV_LINK } from "@/constants/geo";
import type { NavMainItem } from "@/types/components/nav";

const WRITER_NAV_LINKS = new Set([GEO_WRITER_NAV_LINK, GEO_GAPS_NAV_LINK]);

export function isGeoWriterVisibleInNav(flagOn: boolean): boolean {
  return flagOn || process.env.NODE_ENV === "development";
}

export function filterGeoWriterNavItems(
  items: NavMainItem[],
  writerVisible: boolean
): NavMainItem[] {
  if (writerVisible) {
    return items;
  }
  return items.filter((item) => !WRITER_NAV_LINKS.has(item.link));
}
