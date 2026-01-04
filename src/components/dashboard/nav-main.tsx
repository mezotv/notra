"use client";

import {
  AnalyticsUpIcon,
  CorporateIcon,
  NoteIcon,
  PlugIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  const { activeOrganization } = useOrganizationsContext();

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href={`/${slug}/integrations`}>
                  <HugeiconsIcon icon={PlugIcon} />
                  <span>Integrations</span>
                </Link>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href={`/${slug}/content`}>
                  <HugeiconsIcon icon={NoteIcon} />
                  <span>Content</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Brand</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link href={`/${slug}/brand/identity`}>
                    <HugeiconsIcon icon={CorporateIcon} />
                    <span>Identity</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link href={`/${slug}/brand/logs`}>
                    <HugeiconsIcon icon={AnalyticsUpIcon} />
                    <span>Logs</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
