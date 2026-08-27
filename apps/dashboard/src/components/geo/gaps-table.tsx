"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { EngineIcon } from "@/components/geo/engine-icon";
import { LogoStack } from "@/components/geo/logo-stack";
import { StatusSpinner } from "@/components/geo/status-spinner";
import { Table, type TableColumn } from "@/components/motion/table";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import {
  GEO_COMPETITOR_KIND_DETAIL,
  GEO_GAPS_EMPTY,
  GEO_GAPS_ENGINE_FILTER_ALL,
  GEO_GAPS_METER_STEPS,
  GEO_GAPS_METER_TONE_CLASS,
  GEO_GAPS_TABLE_HEIGHT,
  GEO_PROMPTS_NAV_LINK,
} from "@/constants/geo";
import { findCompetitor } from "@/lib/geo/domain";
import { cn } from "@/lib/utils";
import type {
  GeoGapsEmptyProps,
  GeoGapsFiltersProps,
  GeoGapsTab,
  GeoGapsTableProps,
  GeoGapsTabsProps,
} from "@/types/components/geo-gaps";
import type { GeoPromptGapRow, GeoSearchGapRow } from "@/types/geo";
import { engineFamilyLabel, formatMentionRate } from "@/utils/geo-charts";
import { matchTrackedCompetitorNames } from "@/utils/geo-competitors";
import {
  filterPromptGaps,
  filterSearchGaps,
  gapMeterLevel,
  gapMeterTone,
  gapMissingEngineFamilies,
  gapWriteAction,
  gapWriteLabel,
  geoGapsEmptyKind,
  uniqueGapEngineFamilies,
} from "@/utils/geo-gaps";
import { withGeoProject } from "@/utils/geo-paths";

function remainingTableHeight(element: HTMLElement): number {
  const elementTop = element.getBoundingClientRect().top;
  const page = element.closest("[data-geo-gaps-page]");
  const pagePadding =
    page instanceof HTMLElement
      ? Number.parseFloat(getComputedStyle(page).paddingBottom)
      : Number.NaN;
  const inset = Number.isFinite(pagePadding) ? pagePadding : 24;

  let pageAvailable = 0;
  if (page instanceof HTMLElement) {
    pageAvailable = page.getBoundingClientRect().bottom - inset - elementTop;
  }

  let scrollAvailable = 0;
  let parent: HTMLElement | null = element.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      scrollAvailable =
        parent.getBoundingClientRect().bottom - inset - elementTop;
      break;
    }
    parent = parent.parentElement;
  }

  return Math.max(element.clientHeight, pageAvailable, scrollAvailable);
}

function useFillHeight(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const update = () => {
      const next = Math.floor(remainingTableHeight(element));
      if (next > 0) {
        setHeight((current) => (current === next ? current : next));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    const page = element.closest("[data-geo-gaps-page]");
    if (page instanceof HTMLElement) {
      observer.observe(page);
    }
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return [ref, height] as const;
}

function WriteCell({
  action,
  postId,
  onOpenPost,
  onWrite,
}: {
  action: ReturnType<typeof gapWriteAction>;
  postId: string | null | undefined;
  onOpenPost: (postId: string) => void;
  onWrite: () => void;
}) {
  return (
    <Button
      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      onClick={(event) => {
        event.stopPropagation();
        if (
          (action === "open" || action === "review" || action === "writing") &&
          postId
        ) {
          onOpenPost(postId);
          return;
        }
        onWrite();
      }}
      size="sm"
      variant={action === "write" ? "default" : "outline"}
    >
      {gapWriteLabel(action)}
    </Button>
  );
}

function GapMeter({ level, label }: { level: number; label: string }) {
  const filledClass = GEO_GAPS_METER_TONE_CLASS[gapMeterTone(level)];
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className="inline-flex h-4 cursor-default items-end gap-1"
          />
        }
      >
        {Array.from({ length: GEO_GAPS_METER_STEPS }, (_, index) => (
          <span
            className={cn(
              "w-1.5 rounded-[1px]",
              index < level ? cn("h-4", filledClass) : "bg-muted h-2.5"
            )}
            key={index}
          />
        ))}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ContentCell({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string | null;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm leading-snug font-medium">{title}</span>
      {subtitle ? (
        <span className="text-muted-foreground truncate text-xs">
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}

function MissingEnginesCell({ engines }: { engines: string[] }) {
  const families = gapMissingEngineFamilies(engines);
  return (
    <LogoStack
      items={families.map((family) => ({
        key: family,
        label: engineFamilyLabel(family),
        renderIcon: (className) => (
          <EngineIcon className={className} engine={family} />
        ),
      }))}
    />
  );
}

function GapsEmpty({
  kind,
  isScanning,
  organizationSlug,
  onRunScan,
}: GeoGapsEmptyProps) {
  const { projectId } = useGeoProjectScope();
  const copy = GEO_GAPS_EMPTY[kind];
  const action =
    kind === "no-scan" ? (
      <Button disabled={isScanning} onClick={onRunScan}>
        {isScanning ? <StatusSpinner /> : null}
        {GEO_GAPS_EMPTY["no-scan"].action}
      </Button>
    ) : kind === "no-search-gaps" ? (
      <Button
        nativeButton={false}
        render={
          <Link
            href={withGeoProject(
              `/${organizationSlug}${GEO_PROMPTS_NAV_LINK}`,
              projectId
            )}
          />
        }
      >
        {GEO_GAPS_EMPTY["no-search-gaps"].action}
      </Button>
    ) : null;

  return (
    <EmptyState
      action={action}
      description={copy.description}
      preview={
        <EmptyStateTablePreview
          columns={EMPTY_STATE_TABLE_COLUMNS.gaps}
          rows={EMPTY_STATE_TABLE_ROWS}
        />
      }
      title={copy.title}
    />
  );
}

function GapsTabCount({ count }: { count: number }) {
  return (
    <span className="text-muted-foreground tabular-nums">
      ({count.toLocaleString()})
    </span>
  );
}

function GapsTabs({
  tab,
  onTabChange,
  promptCount,
  searchCount,
}: GeoGapsTabsProps) {
  return (
    <Tabs
      onValueChange={(value) => {
        if (value === "prompt" || value === "search") {
          onTabChange(value);
        }
      }}
      value={tab}
    >
      <TabsList variant="line">
        <TabsTrigger value="prompt">
          Prompt Gaps
          <GapsTabCount count={promptCount} />
        </TabsTrigger>
        <TabsTrigger value="search">
          Search Gaps
          <GapsTabCount count={searchCount} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function GapsFilters({
  query,
  onQueryChange,
  engine,
  onEngineChange,
  engineFamilies,
}: GeoGapsFiltersProps) {
  const showEngineFilter =
    engineFamilies.length > 0 || engine !== GEO_GAPS_ENGINE_FILTER_ALL;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-72">
        <HugeiconsIcon
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          icon={SearchIcon}
          size={15}
        />
        <Input
          aria-label="Filter content gaps"
          className="pl-9"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter gaps..."
          value={query}
        />
      </div>
      {showEngineFilter ? (
        <Select
          onValueChange={(value) =>
            onEngineChange(value ?? GEO_GAPS_ENGINE_FILTER_ALL)
          }
          value={engine}
        >
          <SelectTrigger aria-label="Filter by missing engine" className="w-44">
            <SelectValue>
              {engine === GEO_GAPS_ENGINE_FILTER_ALL
                ? "All engines"
                : engineFamilyLabel(engine)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-56">
            <SelectItem value={GEO_GAPS_ENGINE_FILTER_ALL}>
              All engines
            </SelectItem>
            {engineFamilies.map((family) => (
              <SelectItem key={family} value={family}>
                <span className="flex items-center gap-2">
                  <EngineIcon className="size-3.5" engine={family} />
                  {engineFamilyLabel(family)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

function BrandMentionsCell({
  competitors,
  names,
}: {
  competitors: GeoGapsTableProps["competitors"];
  names: string[];
}) {
  const tracked =
    competitors.length === 0
      ? names
      : matchTrackedCompetitorNames(names, competitors);
  return (
    <LogoStack
      items={tracked.map((name) => {
        const competitor = findCompetitor(competitors, name);
        return {
          key: name,
          label: name,
          detail: competitor
            ? GEO_COMPETITOR_KIND_DETAIL[competitor.kind]
            : null,
          renderIcon: (className) => (
            <CompetitorLogo
              className={className}
              domain={competitor?.domain ?? null}
              name={name}
            />
          ),
        };
      })}
    />
  );
}

export function GeoGapsTable({
  promptGaps,
  searchGaps,
  competitors,
  hasScanData,
  isScanning,
  organizationSlug,
  onRunScan,
  onWritePrompt,
  onWriteSearch,
  onOpenPost,
}: GeoGapsTableProps) {
  const [tab, setTab] = useState<GeoGapsTab>("prompt");
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [engine, setEngine] = useQueryState(
    "engine",
    parseAsString
      .withDefault(GEO_GAPS_ENGINE_FILTER_ALL)
      .withOptions({ clearOnDefault: true })
  );
  const maxOpportunity = useMemo(
    () => Math.max(0, ...promptGaps.map((row) => row.opportunity)),
    [promptGaps]
  );
  const engineFamilies = useMemo(() => {
    const families = uniqueGapEngineFamilies(promptGaps);
    if (engine !== GEO_GAPS_ENGINE_FILTER_ALL && !families.includes(engine)) {
      return [engine, ...families];
    }
    return families;
  }, [engine, promptGaps]);
  const filteredPromptGaps = useMemo(
    () => filterPromptGaps(promptGaps, query, engine),
    [engine, promptGaps, query]
  );
  const filteredSearchGaps = useMemo(
    () => filterSearchGaps(searchGaps, query),
    [query, searchGaps]
  );

  const promptColumns = useMemo<TableColumn<GeoPromptGapRow>[]>(
    () => [
      {
        key: "prompt",
        header: "Content",
        width: "1fr",
        cell: (row) => {
          const headline = row.brief?.workingTitle ?? row.title;
          return (
            <ContentCell
              subtitle={headline ? row.prompt : null}
              title={headline ?? row.prompt}
            />
          );
        },
        sortValue: (row) => row.brief?.workingTitle ?? row.title ?? row.prompt,
        sortable: true,
      },
      {
        key: "opportunity",
        header: "Opportunity",
        width: "7.5rem",
        cell: (row) => {
          const intensity =
            maxOpportunity <= 0 ? 0 : row.opportunity / maxOpportunity;
          const level = gapMeterLevel(intensity);
          return (
            <GapMeter
              label={`${formatMentionRate(row.ownMentionRate)} mention rate · ${level}/${GEO_GAPS_METER_STEPS} opportunity`}
              level={level}
            />
          );
        },
        sortValue: (row) => row.opportunity,
        sortable: true,
      },
      {
        key: "engines",
        header: "Missing engines",
        width: "9.5rem",
        cell: (row) => <MissingEnginesCell engines={row.engines} />,
        sortValue: (row) => gapMissingEngineFamilies(row.engines).length,
        sortable: true,
      },
      {
        key: "competitors",
        header: "Brand mentions",
        width: "9rem",
        cell: (row) => (
          <BrandMentionsCell
            competitors={competitors}
            names={row.competitors}
          />
        ),
        sortValue: (row) => row.competitors.length,
        sortable: true,
      },
      {
        key: "write",
        header: "",
        align: "right",
        width: "7rem",
        minWidth: "7rem",
        cell: (row) => (
          <WriteCell
            action={gapWriteAction(row.brief)}
            onOpenPost={onOpenPost}
            onWrite={() => onWritePrompt(row)}
            postId={row.brief?.postId}
          />
        ),
      },
    ],
    [competitors, maxOpportunity, onOpenPost, onWritePrompt]
  );

  const searchColumns = useMemo<TableColumn<GeoSearchGapRow>[]>(
    () => [
      {
        key: "prompt",
        header: "Content",
        width: "1fr",
        cell: (row) => {
          const headline = row.brief?.workingTitle ?? row.title;
          return (
            <ContentCell
              subtitle={headline ? row.prompt : null}
              title={headline ?? row.prompt}
            />
          );
        },
        sortValue: (row) => row.brief?.workingTitle ?? row.title ?? row.prompt,
        sortable: true,
      },
      {
        key: "impressions",
        header: "Impressions",
        width: "7.5rem",
        cell: (row) =>
          row.impressions === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums">
              {row.impressions.toLocaleString()}
            </span>
          ),
        sortValue: (row) => row.impressions ?? -1,
        sortable: true,
      },
      {
        key: "write",
        header: "",
        align: "right",
        width: "7rem",
        minWidth: "7rem",
        cell: (row) => (
          <WriteCell
            action={gapWriteAction(row.brief)}
            onOpenPost={onOpenPost}
            onWrite={() => onWriteSearch(row)}
            postId={row.brief?.postId}
          />
        ),
      },
    ],
    [onOpenPost, onWriteSearch]
  );

  const sourceRows = tab === "prompt" ? promptGaps : searchGaps;
  const rows = tab === "prompt" ? filteredPromptGaps : filteredSearchGaps;
  const [tableRef, tableHeight] = useFillHeight(GEO_GAPS_TABLE_HEIGHT);
  const table =
    tab === "prompt" ? (
      <Table
        className="rounded-2xl"
        columns={promptColumns}
        data={filteredPromptGaps}
        defaultSort={{ key: "opportunity", direction: "desc" }}
        getRowId={(row) => row.id}
        height={tableHeight}
      />
    ) : (
      <Table
        className="rounded-2xl"
        columns={searchColumns}
        data={filteredSearchGaps}
        defaultSort={{ key: "impressions", direction: "desc" }}
        getRowId={(row) => row.id}
        height={tableHeight}
      />
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <GapsTabs
          onTabChange={setTab}
          promptCount={filteredPromptGaps.length}
          searchCount={filteredSearchGaps.length}
          tab={tab}
        />
        <GapsFilters
          engine={engine}
          engineFamilies={engineFamilies}
          onEngineChange={setEngine}
          onQueryChange={setQuery}
          query={query}
        />
      </div>

      <div className="min-h-0 flex-1" ref={tableRef}>
        {rows.length === 0 ? (
          <GapsEmpty
            isScanning={isScanning}
            kind={geoGapsEmptyKind({
              tab,
              hasScanData,
              isScanning,
              hasSourceRows: sourceRows.length > 0,
              hasMatches: rows.length > 0,
            })}
            onRunScan={onRunScan}
            organizationSlug={organizationSlug}
          />
        ) : (
          table
        )}
      </div>
    </div>
  );
}
