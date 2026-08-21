"use client";

import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { useAsyncDebouncer } from "@tanstack/react-pacer";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { GeoEnginePicker } from "@/components/geo/geo-engine-picker";
import { GeoLanguagePicker } from "@/components/geo/geo-language-picker";
import { GeoTagList } from "@/components/geo/geo-tag-list";
import {
  GEO_MAX_ALIASES,
  GEO_MAX_COMPETITORS,
  GEO_SETTINGS_AUTO_SAVE_MS,
} from "@/constants/geo";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import { useIsProPlan } from "@/lib/hooks/use-plan";
import type { GeoSettingsFormProps, GeoSettingsUpsertInput } from "@/types/geo";
import { resolveTrackedEngines } from "@/utils/geo-engines";
import { extraGeoLanguages } from "@/utils/geo-language-rows";

export function GeoSettingsForm({
  organizationId,
  organizationSlug,
  settings,
}: GeoSettingsFormProps) {
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
  const [engines, setEngines] = useState<string[]>(() =>
    resolveTrackedEngines(settings?.engines)
  );
  const [enforceZdr, setEnforceZdr] = useState(
    () => settings?.enforceZdr ?? true
  );
  const [nonZdrApproved, setNonZdrApproved] = useState<string[]>(
    () => settings?.nonZdrApprovedEngines ?? []
  );
  const [enabled, setEnabled] = useState(() => settings?.enabled ?? true);
  const { isPro, isLoading: planLoading } = useIsProPlan();
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
    }
  );
  const debouncerRef = useRef(debouncer);
  debouncerRef.current = debouncer;

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
      isPro,
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
          languages: extraGeoLanguages(settings?.languages ?? []),
          engines: resolveTrackedEngines(settings?.engines),
          enforceZdr: settings?.enforceZdr ?? true,
          nonZdrApprovedEngines: settings?.nonZdrApprovedEngines ?? [],
          enabled: settings?.enabled ?? true,
          isPro,
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
    companyName,
    competitors,
    enabled,
    engines,
    enforceZdr,
    isPro,
    languages,
    nonZdrApproved,
    organizationId,
    planLoading,
    settings,
  ]);

  useEffect(() => {
    return () => {
      debouncerRef.current.flush().catch(() => undefined);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          How your brand is identified and where prompts are scanned.
        </p>
      </header>
      <div className="space-y-8">
        <div className="grid items-start gap-x-8 gap-y-6 md:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`${id}-name`}>Company name</Label>
              <p className="text-muted-foreground text-sm">
                The primary name we match in answers.
              </p>
            </div>
            <Input
              aria-invalid={nameMissing && savedAt !== null}
              id={`${id}-name`}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Notra"
              value={companyName}
            />
          </div>
          <SettingsSection
            description="English is always scanned. Add markets you want to measure beyond that."
            title="Languages"
          >
            <GeoLanguagePicker
              labeled={false}
              onChange={setLanguages}
              selected={languages}
            />
          </SettingsSection>
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
            description={
              <>
                Names to track against yours. Manage websites and colors on the{" "}
                <Link
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  href={`/${organizationSlug}/geo/competitors`}
                  prefetch={true}
                >
                  Competitors
                </Link>{" "}
                page.
              </>
            }
            id={`${id}-competitors`}
            label="Competitors"
            max={GEO_MAX_COMPETITORS}
            onChange={setCompetitors}
            placeholder="Competitor name"
            values={competitors}
          />
        </div>
        <SettingsSection
          description="Each enabled model runs on every prompt, grouped by its maker."
          title="Models"
        >
          <GeoEnginePicker
            canEnforceZdr={isPro}
            enforceZdr={enforceZdr}
            labeled={false}
            nonZdrApproved={nonZdrApproved}
            onChange={setEngines}
            onEnforceZdrChange={setEnforceZdr}
            onNonZdrApprovedChange={setNonZdrApproved}
            planLoading={planLoading}
            selected={engines}
          />
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10">
            <div className="space-y-0.5">
              <Label htmlFor={`${id}-enabled`}>Scheduled scans</Label>
              <p className="text-muted-foreground text-xs">
                Pause to stop automatic engine checks.
              </p>
            </div>
            <Switch
              checked={enabled}
              id={`${id}-enabled`}
              onCheckedChange={setEnabled}
            />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function toGeoSettingsPayload({
  isPro,
  ...input
}: GeoSettingsUpsertInput & { isPro: boolean }): GeoSettingsUpsertInput {
  return {
    ...input,
    companyName: input.companyName.trim(),
    enforceZdr: isPro && input.enforceZdr,
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
    <section className="min-w-0 space-y-3">
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
