"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SETTINGS_ACCOUNT_NAV_ITEMS,
  SETTINGS_ORGANIZATION_NAV_ITEMS,
} from "@/constants/nav";
import { useHasAiCreditsFeature } from "@/lib/hooks/use-plan";
import type { NavSettingsProps } from "@/types/components/nav";
import { SidebarLabel } from "./sidebar-label";

export function NavSettings({ slug }: NavSettingsProps) {
  const pathname = usePathname();
  const { hasAiCredits } = useHasAiCreditsFeature();

  const isActive = (url: string) => pathname === `/${slug}/${url}`;
  const organizationItems = SETTINGS_ORGANIZATION_NAV_ITEMS.filter(
    (item) => !item.requiresAiCredits || hasAiCredits
  );

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>
          <SidebarLabel>Account</SidebarLabel>
        </SidebarGroupLabel>
        <SidebarMenu>
          {SETTINGS_ACCOUNT_NAV_ITEMS.map((item) => (
            <SidebarMenuButton
              isActive={isActive(item.url)}
              key={item.label}
              render={
                <Link href={`/${slug}/${item.url}`} prefetch={true} replace>
                  <HugeiconsIcon icon={item.icon} />
                  <SidebarLabel>{item.label}</SidebarLabel>
                </Link>
              }
              tooltip={item.label}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>
          <SidebarLabel>Organization</SidebarLabel>
        </SidebarGroupLabel>
        <SidebarMenu>
          {organizationItems.map((item) => (
            <SidebarMenuButton
              isActive={isActive(item.url)}
              key={item.label}
              render={
                <Link href={`/${slug}/${item.url}`} prefetch={true} replace>
                  <HugeiconsIcon icon={item.icon} />
                  <SidebarLabel>{item.label}</SidebarLabel>
                </Link>
              }
              tooltip={item.label}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
