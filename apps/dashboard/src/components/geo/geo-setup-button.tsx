"use client";

import { useState } from "react";

import { Button } from "@/components/button";
import { GeoProjectCreateDialog } from "@/components/geo/project-create-dialog";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import type { GeoSetupButtonProps } from "@/types/geo";

export function GeoSetupButton({
  organizationId,
  children = "Set up GEO tracking",
  className,
  size,
}: GeoSetupButtonProps) {
  const [open, setOpen] = useState(false);
  const [, setProjectParam] = useGeoProjectQueryState();

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        size={size}
        type="button"
      >
        {children}
      </Button>
      <GeoProjectCreateDialog
        onCreated={(projectId) => setProjectParam(projectId)}
        onOpenChange={setOpen}
        open={open}
        organizationId={organizationId}
      />
    </>
  );
}
