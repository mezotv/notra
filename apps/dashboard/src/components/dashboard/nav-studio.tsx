"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
} from "@notra/ui/components/ui/sidebar";
import { useIsApplePlatform } from "@notra/ui/hooks/use-is-apple-platform";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCommandPalette } from "@/components/command-palette/command-palette-context";
import {
  NAV_AUTOMATION_LINKS,
  NAV_CATEGORY_LABELS,
  NAV_PRIMARY_ACTIONS,
  NAV_STUDIO_ALL_LINKS,
  NAV_STUDIO_LINKS,
} from "@/constants/nav";
import { useNavVisibility } from "@/lib/hooks/use-nav-visibility";
import type { NavStudioProps } from "@/types/components/nav";
import { resolveActiveNavLink } from "@/utils/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavList } from "./nav-list";
import { NavPrimaryAction } from "./nav-primary-action";
import { NavRecentContent } from "./nav-recent-content";
import { NavSearch } from "./nav-search";

const CreateContentDialog = dynamic(
  () =>
    import("@/components/content/create-content-dialog").then(
      (mod) => mod.CreateContentDialog
    ),
  { ssr: false }
);

export function NavStudio({ slug, organizationId }: NavStudioProps) {
  const pathname = usePathname();
  const visibility = useNavVisibility();
  const isApplePlatform = useIsApplePlatform();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const [createOpen, setCreateOpen] = useState(false);
  const [createMounted, setCreateMounted] = useState(false);
  const activeLink = resolveActiveNavLink(pathname, slug, NAV_STUDIO_ALL_LINKS);
  const createAction = NAV_PRIMARY_ACTIONS.studio;

  function openCreate() {
    setCreateMounted(true);
    setCreateOpen(true);
  }

  return (
    <>
      <NavPrimaryAction
        icon={createAction.icon}
        label={createAction.label}
        onClick={openCreate}
      />
      <NavSearch
        isApplePlatform={isApplePlatform}
        onOpen={() => setCommandPaletteOpen(true)}
      />
      <SidebarGroup>
        <SidebarGroupContent>
          <NavList
            activeLink={activeLink}
            links={NAV_STUDIO_LINKS}
            slug={slug}
            visibility={visibility}
          />
        </SidebarGroupContent>
      </SidebarGroup>
      <NavRecentContent organizationId={organizationId} slug={slug} />
      <CollapsibleSidebarGroup label={NAV_CATEGORY_LABELS.automation}>
        <NavList
          activeLink={activeLink}
          links={NAV_AUTOMATION_LINKS}
          slug={slug}
          visibility={visibility}
        />
      </CollapsibleSidebarGroup>
      {createMounted && (
        <CreateContentDialog
          hideTrigger
          onOpenChange={setCreateOpen}
          open={createOpen}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
