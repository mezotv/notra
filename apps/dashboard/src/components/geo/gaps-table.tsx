"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { EngineIcon } from "@/components/geo/engine-icon";
import { StatusSpinner } from "@/components/geo/status-spinner";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import {
  GEO_COMPETITOR_KIND_DETAIL,
  GEO_GAPS_EMPTY,
  GEO_GAPS_LOGO_STACK_LIMIT,
  GEO_GAPS_METER_STEPS,
  GEO_GAPS_METER_TONE_CLASS,
  GEO_GAPS_TABLE_HEIGHT,
  GEO_PROMPTS_NAV_LINK,
} from "@/constants/geo";
import { findCompetitor } from "@/lib/geo/domain";
import { cn } from "@/lib/utils";
import type {
  GeoGapsEmptyProps,
  GeoGapsLogoStackItem,
  GeoGapsLogoStackProps,
  GeoGapsTab,
  GeoGapsTableProps,
  GeoGapsTabsProps,
} from "@/types/components/geo-gaps";
import type { GeoPromptGapRow, GeoSearchGapRow } from "@/types/geo";
import { engineFamilyLabel, formatMentionRate } from "@/utils/geo-charts";
import { matchTrackedCompetitorNames } from "@/utils/geo-competitors";
import {
  gapMeterLevel,
  gapMeterTone,
  gapMissingEngineFamilies,
  gapWriteAction,
  gapWriteLabel,
  geoGapsEmptyKind,
} from "@/utils/geo-gaps";

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
      className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
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
              index < level ? cn("h-4", filledClass) : "h-2.5 bg-muted"
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
      <span className="truncate font-medium text-sm leading-snug">{title}</span>
      {subtitle ? (
        <span className="truncate text-muted-foreground text-xs">
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}

function LogoStackItemDetail({ item }: { item: GeoGapsLogoStackItem }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex shrink-0">{item.renderIcon("size-5")}</span>
      <span className="min-w-0">
        <span className="block font-medium">{item.label}</span>
        {item.detail ? (
          <span className="block text-muted-foreground text-xs">
            {item.detail}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function LogoStack({ items }: GeoGapsLogoStackProps) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = items.slice(0, GEO_GAPS_LOGO_STACK_LIMIT);
  const hidden = items.slice(GEO_GAPS_LOGO_STACK_LIMIT);

  return (
    <span className="inline-flex items-center gap-1">
      {visible.map((item) => (
        <Tooltip key={item.key}>
          <TooltipTrigger
            render={<span className="inline-flex shrink-0 cursor-default" />}
          >
            {item.renderIcon("size-4")}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <LogoStackItemDetail item={item} />
          </TooltipContent>
        </Tooltip>
      ))}
      {hidden.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="cursor-default text-muted-foreground text-xs" />
            }
          >
            +{hidden.length}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <span className="flex flex-col gap-1.5">
              {hidden.map((item) => (
                <LogoStackItemDetail item={item} key={item.key} />
              ))}
            </span>
          </TooltipContent>
        </Tooltip>
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
        render={<Link href={`/${organizationSlug}${GEO_PROMPTS_NAV_LINK}`} />}
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

function GapsTabs({
  tab,
  onTabChange,
  promptCount,
  searchCount,
}: GeoGapsTabsProps) {
  return (
    <div className="inline-flex rounded-full bg-muted/70 p-0.5">
      <Button
        className="rounded-full"
        onClick={() => onTabChange("prompt")}
        size="sm"
        variant={tab === "prompt" ? "secondary" : "ghost"}
      >
        Prompt Gaps
        <span className="text-muted-foreground">({promptCount})</span>
      </Button>
      <Button
        className="rounded-full"
        onClick={() => onTabChange("search")}
        size="sm"
        variant={tab === "search" ? "secondary" : "ghost"}
      >
        Search Gaps
        <span className="text-muted-foreground">({searchCount})</span>
      </Button>
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
  const maxOpportunity = useMemo(
    () => Math.max(0, ...promptGaps.map((row) => row.opportunity)),
    [promptGaps]
  );

  const promptColumns = useMemo<TableColumn<GeoPromptGapRow>[]>(
    () => [
      {
        key: "prompt",
        header: "Content",
        width: "2.4fr",
        cell: (row) => {
          const workingTitle = row.brief?.workingTitle;
          return (
            <ContentCell
              subtitle={workingTitle ? row.prompt : null}
              title={workingTitle ?? row.prompt}
            />
          );
        },
        sortValue: (row) => row.brief?.workingTitle ?? row.prompt,
        sortable: true,
      },
      {
        key: "opportunity",
        header: "Opportunity",
        width: "8rem",
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
        width: "10rem",
        cell: (row) => <MissingEnginesCell engines={row.engines} />,
        sortValue: (row) => gapMissingEngineFamilies(row.engines).length,
        sortable: true,
      },
      {
        key: "competitors",
        header: "Brand mentions",
        width: "9.5rem",
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
        width: "7.5rem",
        minWidth: "7.5rem",
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
        width: "2.4fr",
        cell: (row) => {
          const workingTitle = row.brief?.workingTitle;
          return (
            <ContentCell
              subtitle={workingTitle ? row.prompt : null}
              title={workingTitle ?? row.prompt}
            />
          );
        },
        sortValue: (row) => row.brief?.workingTitle ?? row.prompt,
        sortable: true,
      },
      {
        key: "impressions",
        header: "Impressions",
        width: "8rem",
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
        width: "7.5rem",
        minWidth: "7.5rem",
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

  const rows = tab === "prompt" ? promptGaps : searchGaps;

  return (
    <div className="space-y-3">
      <GapsTabs
        onTabChange={setTab}
        promptCount={promptGaps.length}
        searchCount={searchGaps.length}
        tab={tab}
      />

      {rows.length === 0 ? (
        <GapsEmpty
          isScanning={isScanning}
          kind={geoGapsEmptyKind({ tab, hasScanData, isScanning })}
          onRunScan={onRunScan}
          organizationSlug={organizationSlug}
        />
      ) : tab === "prompt" ? (
        <Table
          className="rounded-2xl"
          columns={promptColumns}
          data={promptGaps}
          defaultSort={{ key: "opportunity", direction: "desc" }}
          getRowId={(row) => row.id}
          height={GEO_GAPS_TABLE_HEIGHT}
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={searchColumns}
          data={searchGaps}
          defaultSort={{ key: "impressions", direction: "desc" }}
          getRowId={(row) => row.id}
          height={GEO_GAPS_TABLE_HEIGHT}
        />
      )}
    </div>
  );
}
