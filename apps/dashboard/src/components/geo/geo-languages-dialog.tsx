"use client";

import { DEFAULT_LANGUAGE } from "@notra/ai/constants/languages";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { GeoLanguagePicker } from "@/components/geo/geo-language-picker";
import { GEO_SCAN_DEFAULT_INTERVAL_HOURS } from "@/constants/geo";
import { GEO_DEFAULT_ENGINE_IDS } from "@/constants/geo-model-catalog";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import type { GeoSubDialogProps } from "@/types/geo";
import { trackedGeoLanguages } from "@/utils/geo-language-rows";

export function GeoLanguagesDialog({
  open,
  onOpenChange,
  ...bodyProps
}: GeoSubDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <GeoLanguagesDialogBody onOpenChange={onOpenChange} {...bodyProps} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// Mounted only while the dialog is open, so local state starts fresh from
// the saved settings on every open without a reset effect.
function GeoLanguagesDialogBody({
  onOpenChange,
  organizationId,
  settings,
  companyName,
  enabled,
}: Omit<GeoSubDialogProps, "open">) {
  const upsert = useGeoSettingsUpsert(organizationId);
  const [selected, setSelected] = useState<string[]>(() =>
    trackedGeoLanguages(settings?.languages ?? [])
  );

  const handleSave = () => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases: settings?.aliases ?? [],
        competitors: settings?.competitors ?? [],
        languages: selected,
        engines: settings?.engines ?? [...GEO_DEFAULT_ENGINE_IDS],
        enforceZdr: settings?.enforceZdr ?? true,
        nonZdrApprovedEngines: settings?.nonZdrApprovedEngines ?? [],
        enabled,
        scanIntervalHours:
          settings?.scanIntervalHours ?? GEO_SCAN_DEFAULT_INTERVAL_HOURS,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Languages</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Each extra language runs the same prompts so you can see how you
          perform beyond {DEFAULT_LANGUAGE}.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="px-4 md:px-0">
        <GeoLanguagePicker
          labeled={false}
          onChange={setSelected}
          selected={selected}
        />
      </div>
      <ResponsiveDialogFooter>
        <Button disabled={upsert.isPending} onClick={handleSave}>
          {upsert.isPending && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
