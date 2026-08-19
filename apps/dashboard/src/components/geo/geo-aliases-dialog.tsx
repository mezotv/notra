"use client";

import { useMemo } from "react";
import { GeoStringListDialog } from "@/components/geo/geo-string-list-dialog";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import type { GeoSubDialogProps } from "@/types/geo";

export function GeoAliasesDialog({
  open,
  onOpenChange,
  organizationId,
  settings,
  companyName,
  enabled,
}: GeoSubDialogProps) {
  const upsert = useGeoSettingsUpsert(organizationId);
  const values = useMemo(() => settings?.aliases ?? [], [settings]);

  const handleSave = (aliases: string[]) => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases,
        competitors: settings?.competitors ?? [],
        languages: settings?.languages ?? [],
        enabled,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <GeoStringListDialog
      addLabel="Add"
      addPlaceholder="usenotra"
      columnLabel="Alias"
      description="Other names for your brand. Aliases count as mentions too."
      emptyLabel="No aliases yet"
      isPending={upsert.isPending}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      open={open}
      title="Aliases"
      values={values}
    />
  );
}
