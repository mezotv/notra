"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { useEffect, useId, useState } from "react";
import { GeoAliasesDialog } from "@/components/geo/geo-aliases-dialog";
import { GeoCompetitorsDialog } from "@/components/geo/geo-competitors-dialog";
import { GeoLanguagesDialog } from "@/components/geo/geo-languages-dialog";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import type {
  GeoSettingsDialogProps,
  GeoSettingsSectionRowProps,
} from "@/types/geo";

function SectionRow({
  label,
  count,
  disabled,
  onClick,
}: GeoSettingsSectionRowProps) {
  return (
    <button
      className="flex w-full cursor-pointer items-center justify-between border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">·</span>
        <span className="text-muted-foreground tabular-nums">{count}</span>
      </span>
      <HugeiconsIcon
        className="size-4 text-muted-foreground"
        icon={ArrowRight01Icon}
      />
    </button>
  );
}

export function GeoSettingsDialog({
  open,
  onOpenChange,
  organizationId,
  settings,
}: GeoSettingsDialogProps) {
  const id = useId();
  const [companyName, setCompanyName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [aliasesOpen, setAliasesOpen] = useState(false);
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const upsert = useGeoSettingsUpsert(organizationId);

  useEffect(() => {
    if (open) {
      setCompanyName(settings?.companyName ?? "");
      setEnabled(settings?.enabled ?? true);
    }
  }, [open, settings]);

  const handleSave = () => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases: settings?.aliases ?? [],
        competitors: settings?.competitors ?? [],
        languages: settings?.languages ?? [],
        enabled,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const nameMissing = companyName.trim().length === 0;

  return (
    <>
      <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>GEO tracking settings</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              What should AI engines be checked for? Aliases count as mentions
              too.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 px-4 md:px-0">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Company name</Label>
              <Input
                id={`${id}-name`}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Notra"
                value={companyName}
              />
            </div>
            <div className="space-y-2">
              <SectionRow
                count={settings?.aliases.length ?? 0}
                disabled={nameMissing}
                label="Aliases"
                onClick={() => setAliasesOpen(true)}
              />
              <SectionRow
                count={settings?.competitors.length ?? 0}
                disabled={nameMissing}
                label="Competitors"
                onClick={() => setCompetitorsOpen(true)}
              />
              <SectionRow
                count={settings?.languages.length ?? 0}
                disabled={nameMissing}
                label="Languages"
                onClick={() => setLanguagesOpen(true)}
              />
              {nameMissing && (
                <p className="text-muted-foreground text-xs">
                  Add a company name to edit these lists.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${id}-enabled`}>Scans enabled</Label>
              <Switch
                checked={enabled}
                id={`${id}-enabled`}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              disabled={nameMissing || upsert.isPending}
              onClick={handleSave}
            >
              {upsert.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Save
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <GeoAliasesDialog
        companyName={companyName}
        enabled={enabled}
        onOpenChange={setAliasesOpen}
        open={aliasesOpen}
        organizationId={organizationId}
        settings={settings}
      />
      <GeoCompetitorsDialog
        onOpenChange={setCompetitorsOpen}
        open={competitorsOpen}
        organizationId={organizationId}
      />
      <GeoLanguagesDialog
        companyName={companyName}
        enabled={enabled}
        onOpenChange={setLanguagesOpen}
        open={languagesOpen}
        organizationId={organizationId}
        settings={settings}
      />
    </>
  );
}
