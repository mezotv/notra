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
import type { ReactNode } from "react";
import { useState } from "react";

import { SidebarLabel } from "./sidebar-label";

export function CollapsibleSidebarGroup({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  const isIconMode = state === "collapsed" && !isMobile;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible onOpenChange={setOpen} open={isIconMode ? true : open}>
      <SidebarGroup>
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger
              aria-hidden={isIconMode}
              className="hover:text-sidebar-foreground w-full cursor-pointer [&[data-panel-open]>svg]:rotate-0"
              tabIndex={isIconMode ? -1 : undefined}
            >
              <SidebarLabel>{label}</SidebarLabel>
              <HugeiconsIcon
                className="text-sidebar-foreground/50 ml-1 size-3.5! -rotate-90 transition-transform"
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
