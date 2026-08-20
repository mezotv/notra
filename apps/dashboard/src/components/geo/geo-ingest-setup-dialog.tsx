"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { GeoIngestSetup } from "@/components/geo/geo-ingest-setup";
import { useGeoIngestSetup } from "@/lib/hooks/use-geo";
import type { GeoIngestSetupDialogProps } from "@/types/geo";

export function GeoIngestSetupDialog({
  open,
  onOpenChange,
  organizationId,
}: GeoIngestSetupDialogProps) {
  const { data: setup } = useGeoIngestSetup(organizationId);

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-2xl">
        <ResponsiveDialogHeader className="shrink-0 pr-8">
          <ResponsiveDialogTitle>Install the GEO tracker</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Capture every AI crawler and assistant request that hits your site.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">
          <GeoIngestSetup setup={setup} />
        </div>
        <ResponsiveDialogFooter className="shrink-0">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Done
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
