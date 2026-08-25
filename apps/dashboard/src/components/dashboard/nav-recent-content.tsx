"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CONTENT_NAV_LINK,
  NAV_RECENT_LABEL,
  NAV_RECENT_LIMIT,
  NAV_RECENT_SKELETON_IDS,
  POST_STATUS_DOT_CLASS,
  POST_STATUS_LABELS,
} from "@/constants/nav";
import { usePosts } from "@/lib/hooks/use-posts";
import type { NavRecentContentProps } from "@/types/components/nav";
import { SidebarLabel } from "./sidebar-label";

export function NavRecentContent({
  slug,
  organizationId,
}: NavRecentContentProps) {
  const pathname = usePathname();
  const { data, isPending } = usePosts(organizationId, 1);
  const posts = (data?.posts ?? []).slice(0, NAV_RECENT_LIMIT);

  if (!isPending && posts.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <SidebarLabel>{NAV_RECENT_LABEL}</SidebarLabel>
      </SidebarGroupLabel>
      <SidebarMenu>
        {isPending
          ? NAV_RECENT_SKELETON_IDS.map((id) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuSkeleton />
              </SidebarMenuItem>
            ))
          : posts.map((post) => {
              const href = `/${slug}${CONTENT_NAV_LINK}/${post.id}`;
              return (
                <SidebarMenuItem key={post.id}>
                  <SidebarMenuButton
                    isActive={pathname === href}
                    render={
                      <Link href={href}>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            POST_STATUS_DOT_CLASS[post.status]
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {post.title}
                        </span>
                        <span className="ml-auto shrink-0 text-[0.625rem] text-muted-foreground">
                          {POST_STATUS_LABELS[post.status]}
                        </span>
                      </Link>
                    }
                    size="sm"
                    tooltip={post.title}
                  />
                </SidebarMenuItem>
              );
            })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
