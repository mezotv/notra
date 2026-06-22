"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import type * as React from "react";
import { useState } from "react";

export function CollapsibleSidebarGroup({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  const isIconMode = state === "collapsed" && !isMobile;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible onOpenChange={setOpen} open={isIconMode ? true : open}>
      <SidebarGroup>
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className="w-full cursor-pointer hover:text-sidebar-foreground [&[data-panel-open]>svg]:rotate-0">
              {label}
              <HugeiconsIcon
                className="-rotate-90 ml-1 size-3.5! text-sidebar-foreground/50 transition-transform"
                icon={ArrowDown01Icon}
              />
            </CollapsibleTrigger>
          }
        />
        <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
