"use client";
import {
  AnalyticsUpIcon,
  Calendar03Icon,
  Home01Icon,
  Key01Icon,
  MagicWand01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PlugIcon,
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
import type { NavMainCategory, NavMainItem } from "@/types/components/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavBrandIdentity } from "./nav-brand-identity";

const categoryLabels: Record<Exclude<NavMainCategory, "none">, string> = {
  workspace: "Workspace",
  automation: "Automation",
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
    link: "/skills",
    icon: MagicWand01Icon,
    label: "Skills",
    category: "workspace",
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
  pathname,
}: {
  items: NavMainItem[];
  slug: string;
  label?: string;
  pathname: string;
}) {
  if (items.length === 0) {
    return null;
  }

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const href = `/${slug}${item.link}`;
        const isActive =
          item.link === ""
            ? pathname === `/${slug}` || pathname === `/${slug}/`
            : pathname.startsWith(href);
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

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const rootItems = itemsByCategory.none;

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
      <NavGroup items={rootItems} pathname={pathname} slug={slug} />
      {categories.map((category) => (
        <Fragment key={category}>
          <NavGroup
            items={itemsByCategory[category]}
            label={categoryLabels[category]}
            pathname={pathname}
            slug={slug}
          />
          {category === "workspace" && <NavBrandIdentity slug={slug} />}
        </Fragment>
      ))}
    </>
  );
}
