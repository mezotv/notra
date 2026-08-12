"use client";
import { useFlag } from "@databuddy/sdk/react";
import {
  AiBrowserIcon,
  AiChat01Icon,
  Analytics01Icon,
  AnalyticsUpIcon,
  Calendar03Icon,
  ChartAnalysisIcon,
  Home01Icon,
  Key01Icon,
  MagicWand01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PlugIcon,
  RainbowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, memo } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { SOCIAL_ANALYTICS_FLAG_KEY } from "@/constants/analytics";
import { IRIS_FLAG_KEY, IRIS_NAV_LINK } from "@/constants/iris";
import type { NavMainCategory, NavMainItem } from "@/types/components/nav";
import {
  filterAnalyticsNavItems,
  isAnalyticsVisibleInNav,
} from "@/utils/analytics-flag";
import { filterIrisNavItems, isIrisVisibleInNav } from "@/utils/iris-flag";
import { resolveActiveNavLink } from "@/utils/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavBrandIdentity } from "./nav-brand-identity";

const categoryLabels: Record<Exclude<NavMainCategory, "none">, string> = {
  workspace: "Workspace",
  automation: "Automation",
  manage: "Manage",
};

const navMainItems: NavMainItem[] = [
  {
    link: "/chat",
    icon: Message01Icon,
    label: "Chat",
    category: "none",
    badge: "Beta",
  },
  {
    link: "",
    icon: Home01Icon,
    label: "Home",
    category: "none",
  },
  {
    link: "/content",
    icon: NoteIcon,
    label: "Content",
    category: "workspace",
  },
  {
    link: "/analytics",
    icon: Analytics01Icon,
    label: "Analytics",
    category: "workspace",
  },
  {
    link: "/skills",
    icon: MagicWand01Icon,
    label: "Skills",
    category: "workspace",
  },
  {
    link: IRIS_NAV_LINK,
    icon: RainbowIcon,
    label: "Iris",
    category: "automation",
  },
  {
    link: "/automation/schedules",
    icon: Calendar03Icon,
    label: "Schedules",
    category: "automation",
  },
  {
    link: "/automation/events",
    icon: Notification03Icon,
    label: "Events",
    category: "automation",
  },
  {
    link: "/api-keys",
    icon: Key01Icon,
    label: "API Keys",
    category: "manage",
  },
  {
    link: "/integrations",
    icon: PlugIcon,
    label: "Integrations",
    category: "manage",
  },
  {
    link: "/logs",
    icon: AnalyticsUpIcon,
    label: "Logs",
    category: "manage",
  },
];

const itemsByCategory: Record<NavMainCategory, NavMainItem[]> = {
  none: [],
  workspace: [],
  automation: [],
  manage: [],
};
for (const item of navMainItems) {
  itemsByCategory[item.category].push(item);
}

const NavGroup = memo(function NavGroup({
  items,
  slug,
  label,
  activeLink,
}: {
  items: NavMainItem[];
  slug: string;
  label?: string;
  activeLink: string | null;
}) {
  if (items.length === 0) {
    return null;
  }

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const href = `/${slug}${item.link}`;
        const isActive = item.link === activeLink;
        return (
          <SidebarMenuItem key={item.link}>
            <SidebarMenuButton
              isActive={isActive}
              render={
                <Link href={href}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge
                      className="ml-auto h-[1.125rem] px-[0.375rem] text-[0.625rem] text-muted-foreground"
                      variant="secondary"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              }
              tooltip={item.label}
            />
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  if (label) {
    return (
      <CollapsibleSidebarGroup label={label}>{menu}</CollapsibleSidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>{menu}</SidebarGroupContent>
    </SidebarGroup>
  );
});

const categories = Object.keys(categoryLabels) as Exclude<
  NavMainCategory,
  "none"
>[];

export function NavMain() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const irisFlag = useFlag(IRIS_FLAG_KEY);
  const irisVisible = isIrisVisibleInNav(irisFlag.on);
  const analyticsFlag = useFlag(SOCIAL_ANALYTICS_FLAG_KEY);
  const analyticsVisible = isAnalyticsVisibleInNav(analyticsFlag.on);

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const rootItems = itemsByCategory.none;
  const activeLink = resolveActiveNavLink(
    pathname,
    slug,
    navMainItems.map((item) => item.link)
  );

  return (
    <>
      <NavGroup activeLink={activeLink} items={rootItems} slug={slug} />
      {categories.map((category) => (
        <Fragment key={category}>
          <NavGroup
            activeLink={activeLink}
            items={filterAnalyticsNavItems(
              filterIrisNavItems(itemsByCategory[category], irisVisible),
              analyticsVisible
            )}
            label={categoryLabels[category]}
            slug={slug}
          />
          {category === "workspace" && <NavBrandIdentity slug={slug} />}
        </Fragment>
      ))}
    </>
  );
}
