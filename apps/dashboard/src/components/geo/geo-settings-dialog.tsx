"use client";

import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
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
import { GEO_LANGUAGE_FLAGS, GEO_MAX_LANGUAGES } from "@/constants/geo";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type { GeoSettings } from "@/types/geo";

interface GeoSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  settings: GeoSettings | null;
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function GeoSettingsDialog({
  open,
  onOpenChange,
  organizationId,
  settings,
}: GeoSettingsDialogProps) {
  const id = useId();
  const [companyName, setCompanyName] = useState("");
  const [aliases, setAliases] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const upsert = useGeoSettingsUpsert(organizationId);

  useEffect(() => {
    if (open) {
      setCompanyName(settings?.companyName ?? "");
      setAliases(settings?.aliases.join(", ") ?? "");
      setCompetitors(settings?.competitors.join(", ") ?? "");
      setLanguages(settings?.languages ?? []);
      setEnabled(settings?.enabled ?? true);
    }
  }, [open, settings]);

  const handleSave = () => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases: parseList(aliases),
        competitors: parseList(competitors),
        languages,
        enabled,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
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
            <Label htmlFor={`${id}-aliases`}>Aliases</Label>
            <Input
              id={`${id}-aliases`}
              onChange={(event) => setAliases(event.target.value)}
              placeholder="usenotra, notra.so (comma separated)"
              value={aliases}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-competitors`}>Competitors to watch</Label>
            <Input
              id={`${id}-competitors`}
              onChange={(event) => setCompetitors(event.target.value)}
              placeholder="Buffer, Hypefury (comma separated)"
              value={competitors}
            />
          </div>
          <div className="space-y-2">
            <Label>Also scan in (up to {GEO_MAX_LANGUAGES})</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LANGUAGES.filter(
                (language) => language !== "English"
              ).map((language) => {
                const selected = languages.includes(language);
                const atLimit =
                  !selected && languages.length >= GEO_MAX_LANGUAGES;
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded-sm border px-2 py-1 text-xs transition-colors",
                      selected
                        ? "border-border bg-muted/60"
                        : "border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/40",
                      atLimit && "cursor-not-allowed opacity-40"
                    )}
                    disabled={atLimit}
                    key={language}
                    onClick={() =>
                      setLanguages((previous) =>
                        previous.includes(language)
                          ? previous.filter((item) => item !== language)
                          : [...previous, language]
                      )
                    }
                    type="button"
                  >
                    <span aria-hidden="true">
                      {GEO_LANGUAGE_FLAGS[language]}
                    </span>
                    {language}
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">
              Each scan also asks the engines in these languages so you can see
              how you perform beyond English.
            </p>
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
            disabled={companyName.trim().length === 0 || upsert.isPending}
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
  );
}
