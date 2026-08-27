"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { GeoBar } from "@/components/geo/geo-bar";
import { GeoLanguagesDialog } from "@/components/geo/geo-languages-dialog";
import { StatusSpinner } from "@/components/geo/status-spinner";
import { Twemoji } from "@/components/geo/twemoji";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  GEO_LANGUAGE_FLAGS,
  GEO_MAX_LANGUAGES,
  GEO_VISIBILITY_TABLE_ROWS,
} from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type {
  LanguagePerformanceCardProps,
  LanguagePerformanceRow,
} from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";
import {
  buildLanguagePerformanceRows,
  trackedGeoLanguages,
  withAddedGeoLanguage,
} from "@/utils/geo-language-rows";
import { GEO_VISIBILITY_TABLE_HEIGHT } from "@/utils/table";

function trackedChecksLabel(
  mentions: number,
  checks: number,
  isScanning: boolean
) {
  if (checks > 0) {
    return `${mentions}/${checks} checks`;
  }
  if (isScanning) {
    return "Scanning…";
  }
  return "No checks yet";
}

function LanguageNameCell({
  language,
  muted,
}: {
  language: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-sm",
        muted && "text-muted-foreground"
      )}
    >
      <Twemoji
        className={cn("size-4 shrink-0", muted && "opacity-40")}
        emoji={GEO_LANGUAGE_FLAGS[language] ?? ""}
        label={language}
      />
      <span className={cn("min-w-0 truncate", !muted && "font-medium")}>
        {language}
      </span>
    </span>
  );
}

function LanguageAddButton({
  language,
  disabled,
  limitReached,
  pending,
  onAdd,
}: {
  language: string;
  disabled: boolean;
  limitReached: boolean;
  pending: boolean;
  onAdd: (language: string) => void;
}) {
  const content = pending ? (
    <StatusSpinner />
  ) : (
    <HugeiconsIcon className="size-3.5" icon={PlusSignIcon} />
  );

  if (limitReached) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-disabled="true"
              aria-label={`Add ${language}`}
              className="shrink-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100"
              onClick={(event) => event.preventDefault()}
              size="sm"
              type="button"
              variant="outline"
            />
          }
        >
          {content}
          Add
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          You can track up to {GEO_MAX_LANGUAGES} additional languages. Remove
          one in Languages to add {language}.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      aria-label={`Add ${language}`}
      className="shrink-0"
      disabled={disabled}
      onClick={() => onAdd(language)}
      size="sm"
      type="button"
      variant="outline"
    >
      {content}
      Add
    </Button>
  );
}

function languagePerformanceColumns({
  adding,
  atLimit,
  isScanning,
  pendingLanguage,
  onAddLanguage,
}: {
  adding: boolean;
  atLimit: boolean;
  isScanning: boolean;
  pendingLanguage: string | undefined;
  onAddLanguage: (language: string) => void;
}): TableColumn<LanguagePerformanceRow>[] {
  return [
    {
      key: "language",
      header: "Language",
      width: "1fr",
      sortable: true,
      cell: (row) => (
        <LanguageNameCell
          language={row.language}
          muted={row.kind === "suggested"}
        />
      ),
    },
    {
      key: "mentionRate",
      header: "Mention rate",
      width: "1.3fr",
      sortable: true,
      sortValue: (row) =>
        row.kind === "tracked" ? row.mentionRate : Number.NEGATIVE_INFINITY,
      cell: (row) =>
        row.kind === "suggested" ? (
          <span className="text-muted-foreground/50 text-xs">Not tracked</span>
        ) : (
          <span className="flex items-center gap-2">
            <GeoBar
              className="h-2 max-w-40"
              fillClassName="bg-geo-search"
              value={row.mentionRate}
            />
            <span className="shrink-0 text-xs tabular-nums">
              {formatMentionRate(row.mentionRate)}
            </span>
          </span>
        ),
    },
    {
      key: "checks",
      header: "Checks",
      width: "7.5rem",
      sortable: true,
      sortValue: (row) =>
        row.kind === "tracked" ? row.checks : Number.NEGATIVE_INFINITY,
      cell: (row) =>
        row.kind === "suggested" ? (
          <LanguageAddButton
            disabled={adding || atLimit}
            language={row.language}
            limitReached={atLimit}
            onAdd={onAddLanguage}
            pending={pendingLanguage === row.language}
          />
        ) : (
          <span className="text-muted-foreground text-[0.6875rem] tabular-nums">
            {trackedChecksLabel(row.mentions, row.checks, isScanning)}
          </span>
        ),
    },
  ];
}

export function LanguagePerformanceCard({
  points,
  organizationId,
  settings,
  isScanning = false,
}: LanguagePerformanceCardProps) {
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [languageToAdd, setLanguageToAdd] = useState<string>();
  const upsert = useGeoSettingsUpsert(organizationId);
  const savedExtras = trackedGeoLanguages(settings.languages);
  const savedExtraSet = new Set(savedExtras);
  const configuredLanguages =
    upsert.isPending && upsert.variables
      ? trackedGeoLanguages(upsert.variables.languages)
      : savedExtras;
  const pendingLanguage =
    configuredLanguages.find((language) => !savedExtraSet.has(language)) ??
    savedExtras.find((language) => !configuredLanguages.includes(language));
  const atLimit = configuredLanguages.length >= GEO_MAX_LANGUAGES;

  const rows = buildLanguagePerformanceRows({
    configuredLanguages,
    points,
    slotCount: GEO_VISIBILITY_TABLE_ROWS,
  });

  const persistLanguages = useCallback(
    (next: string[] | null) => {
      if (upsert.isPending) {
        return;
      }
      const companyName = settings.companyName.trim();
      if (next === null || companyName.length === 0) {
        return;
      }
      upsert.mutate({
        aliases: settings.aliases,
        companyName,
        competitors: settings.competitors,
        enabled: settings.enabled,
        enforceZdr: settings.enforceZdr,
        engines: settings.engines,
        languages: next,
        nonZdrApprovedEngines: settings.nonZdrApprovedEngines,
        organizationId,
        scanIntervalHours: settings.scanIntervalHours,
      });
    },
    [
      organizationId,
      settings.aliases,
      settings.companyName,
      settings.competitors,
      settings.enabled,
      settings.enforceZdr,
      settings.engines,
      settings.nonZdrApprovedEngines,
      settings.scanIntervalHours,
      upsert,
    ]
  );

  const handleConfirmAddLanguage = useCallback(() => {
    if (!languageToAdd) {
      return;
    }
    persistLanguages(withAddedGeoLanguage(configuredLanguages, languageToAdd));
    setLanguageToAdd(undefined);
  }, [configuredLanguages, languageToAdd, persistLanguages]);

  const columns = useMemo(
    () =>
      languagePerformanceColumns({
        adding: upsert.isPending,
        atLimit,
        isScanning,
        onAddLanguage: setLanguageToAdd,
        pendingLanguage,
      }),
    [atLimit, isScanning, pendingLanguage, upsert.isPending]
  );

  return (
    <>
      <InstrumentSection
        action={
          <button
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
            onClick={() => setLanguagesOpen(true)}
            type="button"
          >
            Languages
          </button>
        }
        bodyClassName="flex min-h-0 flex-1 flex-col"
        className="h-full"
        eyebrow="Performance by language"
      >
        <Table
          className="rounded-2xl"
          columns={columns}
          data={rows}
          defaultSort={{ key: "mentionRate", direction: "desc" }}
          emptyState="No language results yet"
          getRowId={(row) => `${row.kind}:${row.language}`}
          height={GEO_VISIBILITY_TABLE_HEIGHT}
          minHeight={GEO_VISIBILITY_TABLE_HEIGHT}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      </InstrumentSection>
      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setLanguageToAdd(undefined);
          }
        }}
        open={Boolean(languageToAdd)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Add {languageToAdd}?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will run the same prompts in {languageToAdd} so you can track
              performance in this language.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction onClick={handleConfirmAddLanguage}>
              Add language
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
      <GeoLanguagesDialog
        companyName={settings.companyName}
        enabled={settings.enabled}
        onOpenChange={setLanguagesOpen}
        open={languagesOpen}
        organizationId={organizationId}
        settings={settings}
      />
    </>
  );
}
