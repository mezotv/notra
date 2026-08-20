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
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { GeoLanguagePicker } from "@/components/geo/geo-language-picker";
import { GeoTagList } from "@/components/geo/geo-tag-list";
import { GEO_MAX_ALIASES, GEO_MAX_COMPETITORS } from "@/constants/geo";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import type { GeoSettingsDialogProps } from "@/types/geo";
import { extraGeoLanguages } from "@/utils/geo-language-rows";

export function GeoSettingsDialog({
  open,
  onOpenChange,
  organizationId,
  settings,
}: GeoSettingsDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <GeoSettingsDialogBody
          onOpenChange={onOpenChange}
          organizationId={organizationId}
          settings={settings}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// Mounted only while the dialog is open, so the form state starts fresh from
// the saved settings on every open without a reset effect.
function GeoSettingsDialogBody({
  onOpenChange,
  organizationId,
  settings,
}: Omit<GeoSettingsDialogProps, "open">) {
  const id = useId();
  const [companyName, setCompanyName] = useState(
    () => settings?.companyName ?? ""
  );
  const [aliases, setAliases] = useState(() => settings?.aliases ?? []);
  const [competitors, setCompetitors] = useState(
    () => settings?.competitors ?? []
  );
  const [languages, setLanguages] = useState(() =>
    extraGeoLanguages(settings?.languages ?? [])
  );
  const [enabled, setEnabled] = useState(() => settings?.enabled ?? true);
  const upsert = useGeoSettingsUpsert(organizationId);

  const handleSave = () => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases,
        competitors,
        languages,
        enabled,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const nameMissing = companyName.trim().length === 0;

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Tracking settings</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Company name and aliases count as mentions. Named competitors get
          called out in scans.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="md:-mx-1 max-h-[min(28rem,60vh)] min-w-0 space-y-4 overflow-y-auto px-4 py-1 md:px-1">
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>Company name</Label>
          <Input
            id={`${id}-name`}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Notra"
            value={companyName}
          />
        </div>
        <GeoTagList
          description="Other spellings, product names, or the bare domain."
          id={`${id}-aliases`}
          label="Aliases"
          max={GEO_MAX_ALIASES}
          onChange={setAliases}
          placeholder="usenotra"
          values={aliases}
        />
        <GeoTagList
          description="Websites and colors live on the Competitors page."
          id={`${id}-competitors`}
          label="Competitors"
          max={GEO_MAX_COMPETITORS}
          onChange={setCompetitors}
          placeholder="Competitor name"
          values={competitors}
        />
        <GeoLanguagePicker onChange={setLanguages} selected={languages} />
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor={`${id}-enabled`}>Scans enabled</Label>
            <p className="text-muted-foreground text-xs">
              Turn off to pause scheduled engine checks.
            </p>
          </div>
          <Switch
            checked={enabled}
            id={`${id}-enabled`}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>
      <ResponsiveDialogFooter>
        <Button disabled={nameMissing || upsert.isPending} onClick={handleSave}>
          {upsert.isPending && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
