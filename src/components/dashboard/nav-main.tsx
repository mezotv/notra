"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type Route = {
  id: string;
  title: string;
  icon: IconSvgElement;
  link: string;
  subs?: {
    title: string;
    link: string;
    icon?: IconSvgElement;
  }[];
};

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  const IconComponent = isOpen ? ArrowUp01Icon : ArrowDown01Icon;
  return <HugeiconsIcon className="size-4" icon={IconComponent} />;
}

function SubRouteItem({
  routeId,
  subRoute,
}: {
  routeId: string;
  subRoute: NonNullable<Route["subs"]>[number];
}) {
  return (
    <SidebarMenuSubItem className="h-auto" key={`${routeId}-${subRoute.title}`}>
      <SidebarMenuSubButton
        render={
          <Link
            className="flex items-center rounded-md px-4 py-1.5 font-medium text-muted-foreground text-sm hover:bg-sidebar-muted hover:text-foreground"
            href={subRoute.link}
            prefetch={true}
          >
            {subRoute.title}
          </Link>
        }
      />
    </SidebarMenuSubItem>
  );
}

function CollapsibleRouteItem({
  route,
  isOpen,
  isCollapsed,
  onOpenChange,
}: {
  route: Route;
  isOpen: boolean;
  isCollapsed: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible className="w-full" onOpenChange={onOpenChange} open={isOpen}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            className={cn(
              "flex w-full items-center rounded-lg px-2 transition-colors",
              isOpen
                ? "bg-sidebar-muted text-foreground"
                : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
              isCollapsed ? "justify-center" : null
            )}
          >
            <HugeiconsIcon className="size-4" icon={route.icon} />
            {!isCollapsed && (
              <span className="ml-2 flex-1 font-medium text-sm">
                {route.title}
              </span>
            )}
            {isCollapsed ? null : (
              <span className="ml-auto">
                <ChevronIcon isOpen={isOpen} />
              </span>
            )}
          </SidebarMenuButton>
        }
      />
      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub className="my-1 ml-3.5">
            {route.subs?.map((subRoute) => (
              <SubRouteItem
                key={`${route.id}-${subRoute.title}`}
                routeId={route.id}
                subRoute={subRoute}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function SimpleRouteItem({
  route,
  isCollapsed,
}: {
  route: Route;
  isCollapsed: boolean;
}) {
  return (
    <SidebarMenuButton
      render={
        <Link
          className={cn(
            "flex items-center rounded-lg px-2 text-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-foreground",
            isCollapsed ? "justify-center" : null
          )}
          href={route.link}
          prefetch={true}
        >
          <HugeiconsIcon className="size-4" icon={route.icon} />
          {!isCollapsed && (
            <span className="ml-2 font-medium text-sm">{route.title}</span>
          )}
        </Link>
      }
      tooltip={route.title}
    />
  );
}

export default function DashboardNavigation({ routes }: { routes: Route[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsible === route.id;
        const hasSubRoutes = !!route.subs?.length;

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              <CollapsibleRouteItem
                isCollapsed={isCollapsed}
                isOpen={isOpen}
                onOpenChange={(open) =>
                  setOpenCollapsible(open ? route.id : null)
                }
                route={route}
              />
            ) : (
              <SimpleRouteItem isCollapsed={isCollapsed} route={route} />
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
