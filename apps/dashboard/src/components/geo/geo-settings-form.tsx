"use client";

import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { useAsyncDebouncer } from "@tanstack/react-pacer";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { GeoEnginePicker } from "@/components/geo/geo-engine-picker";
import { GeoLanguagePicker } from "@/components/geo/geo-language-picker";
import { GeoScanSchedule } from "@/components/geo/geo-scan-schedule";
import { GeoTagList } from "@/components/geo/geo-tag-list";
import {
  GEO_MAX_ALIASES,
  GEO_SCAN_DEFAULT_INTERVAL_HOURS,
  GEO_SETTINGS_AUTO_SAVE_MS,
} from "@/constants/geo";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import { useHasZdrEntitlement } from "@/lib/hooks/use-plan";
import type { GeoSettingsFormProps, GeoSettingsUpsertInput } from "@/types/geo";
import { resolveTrackedEngines } from "@/utils/geo-engines";
import { trackedGeoLanguages } from "@/utils/geo-language-rows";

export function GeoSettingsForm({
  organizationId,
  settings,
  catalog,
}: GeoSettingsFormProps) {
  const id = useId();
  const [companyName, setCompanyName] = useState(
    () => settings?.companyName ?? ""
  );
  const [aliases, setAliases] = useState(() => settings?.aliases ?? []);
  const [competitors] = useState(() => settings?.competitors ?? []);
  const [languages, setLanguages] = useState(() =>
    trackedGeoLanguages(settings?.languages ?? [])
  );
  const [engines, setEngines] = useState<string[]>(() =>
    resolveTrackedEngines(catalog, settings?.engines)
  );
  const [enforceZdr, setEnforceZdr] = useState(
    () => settings?.enforceZdr ?? true
  );
  const [nonZdrApproved, setNonZdrApproved] = useState<string[]>(
    () => settings?.nonZdrApprovedEngines ?? []
  );
  const [enabled, setEnabled] = useState(() => settings?.enabled ?? true);
  const [scanIntervalHours, setScanIntervalHours] = useState(
    () => settings?.scanIntervalHours ?? GEO_SCAN_DEFAULT_INTERVAL_HOURS
  );
  const { hasZdr: canEnforceZdr, isLoading: planLoading } =
    useHasZdrEntitlement();
  const upsert = useGeoSettingsUpsert(organizationId, { silentSuccess: true });
  const [savedAt, setSavedAt] = useState<Date | null>(() =>
    settings?.updatedAt ? new Date(settings.updatedAt) : null
  );
  const lastSaved = useRef<string | undefined>(undefined);
  const nameMissing = companyName.trim().length === 0;

  const debouncer = useAsyncDebouncer(
    async (input: GeoSettingsUpsertInput) => {
      await upsert.mutateAsync(input);
      lastSaved.current = JSON.stringify(input);
      setSavedAt(new Date());
    },
    {
      wait: GEO_SETTINGS_AUTO_SAVE_MS,
      throwOnError: false,
    },
    (state) => ({
      isExecuting: state.isExecuting,
      isPending: state.isPending,
    })
  );
  const debouncerRef = useRef(debouncer);

  useEffect(() => {
    debouncerRef.current = debouncer;
  }, [debouncer]);

  useEffect(() => {
    if (planLoading) {
      return;
    }

    const input: GeoSettingsUpsertInput = toGeoSettingsPayload({
      organizationId,
      companyName,
      aliases,
      competitors,
      languages,
      engines,
      enforceZdr,
      nonZdrApprovedEngines: nonZdrApproved,
      enabled,
      scanIntervalHours,
      canEnforceZdr,
    });
    const serialized = JSON.stringify(input);
    const runner = debouncerRef.current;

    if (lastSaved.current === undefined) {
      lastSaved.current = JSON.stringify(
        toGeoSettingsPayload({
          organizationId,
          companyName: settings?.companyName ?? "",
          aliases: settings?.aliases ?? [],
          competitors: settings?.competitors ?? [],
          languages: trackedGeoLanguages(settings?.languages ?? []),
          engines: resolveTrackedEngines(catalog, settings?.engines),
          enforceZdr: settings?.enforceZdr ?? true,
          nonZdrApprovedEngines: settings?.nonZdrApprovedEngines ?? [],
          enabled: settings?.enabled ?? true,
          scanIntervalHours:
            settings?.scanIntervalHours ?? GEO_SCAN_DEFAULT_INTERVAL_HOURS,
          canEnforceZdr,
        })
      );
    }

    if (input.companyName.length === 0) {
      runner.cancel();
      return;
    }

    if (serialized === lastSaved.current) {
      runner.cancel();
      return;
    }

    runner.maybeExecute(input).catch(() => undefined);
  }, [
    aliases,
    catalog,
    companyName,
    competitors,
    enabled,
    engines,
    enforceZdr,
    canEnforceZdr,
    languages,
    nonZdrApproved,
    organizationId,
    planLoading,
    scanIntervalHours,
    settings,
  ]);

  useEffect(() => {
    return () => {
      debouncerRef.current.flush().catch(() => undefined);
    };
  }, []);

  const isSaving = debouncer.state.isPending || debouncer.state.isExecuting;
  let saveStatus: string | null = null;
  if (nameMissing && savedAt) {
    saveStatus = "Add a company name to save";
  } else if (isSaving) {
    saveStatus = "Saving...";
  } else if (savedAt) {
    saveStatus = "Saved";
  }

  return (
    <div className="w-full space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            How your brand is identified and where prompts are scanned.
          </p>
        </div>
        {saveStatus ? (
          <p
            aria-live="polite"
            className="pt-2 text-muted-foreground text-xs tabular-nums"
          >
            {saveStatus}
          </p>
        ) : null}
      </header>
      <div className="space-y-10">
        <section className="min-w-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Company name</Label>
              <p className="text-muted-foreground text-xs">
                The primary name we match in answers.
              </p>
              <Input
                aria-invalid={nameMissing && savedAt !== null}
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
          </div>
        </section>
        <SettingsSection
          description="When enabled models are checked automatically. Manual scans always work."
          title="Scan schedule"
        >
          <GeoScanSchedule
            enabled={enabled}
            id={id}
            intervalHours={scanIntervalHours}
            onEnabledChange={setEnabled}
            onIntervalChange={setScanIntervalHours}
          />
        </SettingsSection>
        <SettingsSection
          description="Languages your prompts are scanned in. English is on by default."
          title="Languages"
        >
          <GeoLanguagePicker
            labeled={false}
            onChange={setLanguages}
            selected={languages}
          />
        </SettingsSection>
        <SettingsSection
          description="Each enabled provider runs on every prompt."
          title="Models"
        >
          <GeoEnginePicker
            canEnforceZdr={canEnforceZdr}
            catalog={catalog}
            enforceZdr={enforceZdr}
            labeled={false}
            nonZdrApproved={nonZdrApproved}
            onChange={setEngines}
            onEnforceZdrChange={setEnforceZdr}
            onNonZdrApprovedChange={setNonZdrApproved}
            planLoading={planLoading}
            selected={engines}
          />
        </SettingsSection>
      </div>
    </div>
  );
}

function toGeoSettingsPayload({
  canEnforceZdr,
  ...input
}: GeoSettingsUpsertInput & {
  canEnforceZdr: boolean;
}): GeoSettingsUpsertInput {
  return {
    ...input,
    companyName: input.companyName.trim(),
    enforceZdr: canEnforceZdr && input.enforceZdr,
  };
}

function SettingsSection({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description: ReactNode;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 font-medium text-sm">
          {title}
          {meta ? (
            <span className="font-normal text-muted-foreground tabular-nums">
              {meta}
            </span>
          ) : null}
        </h2>
        <p className="text-pretty text-muted-foreground text-sm">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
