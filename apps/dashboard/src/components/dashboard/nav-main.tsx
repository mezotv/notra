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
  SearchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Kbd, KbdGroup } from "@notra/ui/components/ui/kbd";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import { useIsApplePlatform } from "@notra/ui/hooks/use-is-apple-platform";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, memo } from "react";
import { useCommandPalette } from "@/components/command-palette/command-palette-context";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { IRIS_FLAG_KEY, IRIS_NAV_LINK } from "@/constants/iris";
import type { NavMainCategory, NavMainItem } from "@/types/components/nav";
import { filterIrisNavItems, isIrisVisibleInNav } from "@/utils/iris-flag";
import { resolveActiveNavLink } from "@/utils/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavBrandIdentity } from "./nav-brand-identity";

const categoryLabels: Record<Exclude<NavMainCategory, "none">, string> = {
  workspace: "Workspace",
  automation: "Automation",
  geo: "GEO",
  manage: "Manage",
};

const navMainItems: NavMainItem[] = [
  {
    link: "",
    icon: Home01Icon,
    label: "Home",
    category: "none",
  },
  {
    link: "/chat",
    icon: Message01Icon,
    label: "Chat",
    category: "none",
    badge: "Beta",
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
    link: "/geo",
    icon: AiBrowserIcon,
    label: "Overview",
    category: "geo",
  },
  {
    link: "/geo/prompts",
    icon: AiChat01Icon,
    label: "Prompts",
    category: "geo",
  },
  {
    link: "/geo/competitors",
    icon: ChartAnalysisIcon,
    label: "Competitors",
    category: "geo",
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
  geo: [],
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
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const isApplePlatform = useIsApplePlatform();
  const irisFlag = useFlag(IRIS_FLAG_KEY);
  const irisVisible = isIrisVisibleInNav(irisFlag.on);

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
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-label="Open command palette"
                className="cursor-pointer border border-sidebar-border/60"
                onClick={() => setCommandPaletteOpen(true)}
                tooltip="Open command palette"
              >
                <HugeiconsIcon icon={SearchIcon} />
                <span>Search</span>
                <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
                  <Kbd>{isApplePlatform ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <NavGroup activeLink={activeLink} items={rootItems} slug={slug} />
      {categories.map((category) => (
        <Fragment key={category}>
          <NavGroup
            activeLink={activeLink}
            items={filterIrisNavItems(itemsByCategory[category], irisVisible)}
            label={categoryLabels[category]}
            slug={slug}
          />
          {category === "workspace" && <NavBrandIdentity slug={slug} />}
        </Fragment>
      ))}
    </>
  );
}
