"use client";

import { useFlag } from "@databuddy/sdk/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GEO_UPGRADE_TOOLTIP, GEO_WRITER_FLAG_KEY } from "@/constants/geo";
import { IRIS_FLAG_KEY } from "@/constants/iris";
import { NAV_CATEGORY_LABELS, NAV_ITEMS_BY_CATEGORY } from "@/constants/nav";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import type { NavCategoryProps } from "@/types/components/nav";
import {
  filterGeoWriterNavItems,
  isGeoWriterVisibleInNav,
} from "@/utils/geo-writer-flag";
import { filterIrisNavItems, isIrisVisibleInNav } from "@/utils/iris-flag";
import { resolveActiveNavLink } from "@/utils/nav";
import { NavLockHint } from "./nav-lock-hint";
import { SidebarLabel } from "./sidebar-label";

export function NavCategory({ category, slug }: NavCategoryProps) {
  const pathname = usePathname();
  const irisFlag = useFlag(IRIS_FLAG_KEY);
  const irisVisible = isIrisVisibleInNav(irisFlag.on);

  const writerFlag = useFlag(GEO_WRITER_FLAG_KEY);
  const writerVisible = isGeoWriterVisibleInNav(writerFlag.on);
  const { isLocked: geoLocked } = useHasGeoFeature();
  const showLock = geoLocked && category === "geo";

  const items = filterGeoWriterNavItems(
    filterIrisNavItems(NAV_ITEMS_BY_CATEGORY[category], irisVisible),
    writerVisible
  );
  const activeLink = resolveActiveNavLink(
    pathname,
    slug,
    items.map((item) => item.link)
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <SidebarLabel>{NAV_CATEGORY_LABELS[category]}</SidebarLabel>
        {showLock && <NavLockHint message={GEO_UPGRADE_TOOLTIP} />}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton
            isActive={item.link === activeLink}
            key={item.link}
            render={
              <Link href={`/${slug}${item.link}`} replace>
                <HugeiconsIcon icon={item.icon} />
                <SidebarLabel>{item.label}</SidebarLabel>
              </Link>
            }
            tooltip={item.label}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
