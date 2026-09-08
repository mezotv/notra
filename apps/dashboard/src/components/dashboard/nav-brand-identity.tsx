"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";

import { useNavBrandIdentity } from "@/lib/hooks/use-nav-brand-identity";
import type {
  NavBrandIdentityLinkProps,
  NavBrandIdentityProps,
  NavCountBadgeProps,
} from "@/types/components/nav";

import { SidebarLabel } from "./sidebar-label";
import { SidebarNavLink } from "./sidebar-nav-link";

export function NavBrandIdentity({ slug }: NavBrandIdentityProps) {
  const model = useNavBrandIdentity(slug);

  if (!model) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <SidebarLabel>Brand Identity</SidebarLabel>
      </SidebarGroupLabel>
      <SidebarMenu>
        {model.items.map((item) => (
          <NavBrandIdentityLink item={item} key={item.tab} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavBrandIdentityLink({ item }: NavBrandIdentityLinkProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={item.isActive}
        render={
          <SidebarNavLink href={item.href} replace>
            <HugeiconsIcon icon={item.icon} />
            <SidebarLabel>{item.label}</SidebarLabel>
            <NavCountBadge count={item.count} />
          </SidebarNavLink>
        }
        tooltip={item.label}
      />
    </SidebarMenuItem>
  );
}

function NavCountBadge({ count }: NavCountBadgeProps) {
  if (count === null) {
    return null;
  }

  if (count <= 0) {
    return null;
  }

  return (
    <span className="text-muted-foreground ml-auto text-xs tabular-nums group-data-[collapsible=icon]:hidden">
      {count}
    </span>
  );
}
