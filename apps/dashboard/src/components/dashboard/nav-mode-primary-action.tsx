"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { GEO_WRITER_NAV_LINK } from "@notra/geo-core/constants/geo";
import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/button";
import {
  NAV_PRIMARY_ACTIONS,
  SIDEBAR_MODE_ENTER_CLASS,
  SIDEBAR_MODE_EXIT_LEFT_CLASS,
  SIDEBAR_MODE_EXIT_RIGHT_CLASS,
  SIDEBAR_MODE_FADE_CLASS,
  SIDEBAR_MODE_SLOT_CLASS,
} from "@/constants/nav";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import type { NavModePrimaryActionProps } from "@/types/components/nav";
import { geoNavHref } from "@/utils/geo-paths";

const CreateContentDialog = dynamic(
  () =>
    import("@/components/content/create-content-dialog").then(
      (mod) => mod.CreateContentDialog
    ),
  { ssr: false }
);

const ACTION_CLASS = `col-start-1 row-start-1 w-full cursor-pointer group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0 ${SIDEBAR_MODE_FADE_CLASS}`;

export function NavModePrimaryAction({
  mode,
  slug,
  organizationId,
  projectId,
}: NavModePrimaryActionProps) {
  const { isLocked: geoLocked } = useHasGeoFeature();
  const [createOpen, setCreateOpen] = useState(false);
  const [createMounted, setCreateMounted] = useState(false);
  const showWrite = !geoLocked;
  const geoActive = mode === "geo";
  const studioActive = mode === "studio";
  const showSlot = studioActive || showWrite;
  const writeAction = NAV_PRIMARY_ACTIONS.geo;
  const createAction = NAV_PRIMARY_ACTIONS.studio;

  function openCreate() {
    setCreateMounted(true);
    setCreateOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          SIDEBAR_MODE_SLOT_CLASS,
          showSlot ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <SidebarGroup className="py-1">
            <div className="grid overflow-hidden">
              {showWrite ? (
                <Button
                  aria-hidden={!geoActive}
                  className={cn(
                    ACTION_CLASS,
                    geoActive
                      ? SIDEBAR_MODE_ENTER_CLASS
                      : SIDEBAR_MODE_EXIT_LEFT_CLASS
                  )}
                  inert={geoActive ? undefined : true}
                  nativeButton={false}
                  render={
                    <Link
                      href={geoNavHref(slug, GEO_WRITER_NAV_LINK, projectId)}
                      prefetch
                    />
                  }
                  size="sm"
                  tabIndex={geoActive ? undefined : -1}
                  title={writeAction.label}
                >
                  <HugeiconsIcon icon={writeAction.icon} />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {writeAction.label}
                  </span>
                </Button>
              ) : null}
              <Button
                aria-hidden={!studioActive}
                className={cn(
                  ACTION_CLASS,
                  studioActive
                    ? SIDEBAR_MODE_ENTER_CLASS
                    : SIDEBAR_MODE_EXIT_RIGHT_CLASS
                )}
                inert={studioActive ? undefined : true}
                onClick={openCreate}
                size="sm"
                tabIndex={studioActive ? undefined : -1}
                title={createAction.label}
              >
                <HugeiconsIcon icon={createAction.icon} />
                <span className="group-data-[collapsible=icon]:hidden">
                  {createAction.label}
                </span>
              </Button>
            </div>
          </SidebarGroup>
        </div>
      </div>
      {createMounted && (
        <CreateContentDialog
          entry="nav_primary"
          hideTrigger
          onOpenChange={setCreateOpen}
          open={createOpen}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
