import {
  CONTENT_NAV_LINK,
  NAV_DRILLDOWN_CATEGORIES,
  NAV_ITEMS_BY_CATEGORY,
} from "@/constants/nav";
import type { NavDrilldownCategory, NavMainItem } from "@/types/components/nav";

export function resolveMainNavGroups(analyticsVisible: boolean): {
  rootItems: NavMainItem[];
  workspaceItems: NavMainItem[];
} {
  if (analyticsVisible) {
    return {
      rootItems: NAV_ITEMS_BY_CATEGORY.none,
      workspaceItems: NAV_ITEMS_BY_CATEGORY.workspace,
    };
  }
  const contentItem = NAV_ITEMS_BY_CATEGORY.workspace.find(
    (item) => item.link === CONTENT_NAV_LINK
  );
  if (!contentItem) {
    return { rootItems: NAV_ITEMS_BY_CATEGORY.none, workspaceItems: [] };
  }
  const [firstItem, ...restItems] = NAV_ITEMS_BY_CATEGORY.none;
  if (!firstItem) {
    return { rootItems: [contentItem], workspaceItems: [] };
  }
  return {
    rootItems: [firstItem, contentItem, ...restItems],
    workspaceItems: [],
  };
}

export function resolveDrilldownCategory(
  section: string | undefined
): NavDrilldownCategory | null {
  if (!section) {
    return null;
  }
  for (const category of NAV_DRILLDOWN_CATEGORIES) {
    const matches = NAV_ITEMS_BY_CATEGORY[category].some(
      (item) => item.link.split("/").filter(Boolean)[0] === section
    );
    if (matches) {
      return category;
    }
  }
  return null;
}

export function resolveActiveNavLink(
  pathname: string,
  slug: string,
  links: readonly string[]
): string | null {
  const root = `/${slug}`;
  let active: string | null = null;
  for (const link of links) {
    const href = `${root}${link}`;
    if (link === "") {
      if (pathname === root || pathname === `${root}/`) {
        active = active ?? link;
      }
      continue;
    }
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (active === null || link.length > active.length)) {
      active = link;
    }
  }
  return active;
}
