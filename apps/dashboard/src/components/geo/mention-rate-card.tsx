"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_EMPTY_PROMPT_RESULTS,
  GEO_EMPTY_TIMESERIES,
  GEO_FAMILY_STAT_TREND_HINT,
  GEO_MENTION_SUMMARY_LESS,
  GEO_MENTION_SUMMARY_VISIBLE,
  GEO_MENTIONS_LABEL,
} from "@notra/geo-core/constants/geo";
import type {
  GeoEngineFamily,
  GeoEngineFamilyTotals,
  MentionProviderRow,
} from "@notra/geo-core/types/geo";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EngineFamilySheet } from "@/components/geo/engine-family-sheet";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type { MentionRateCardProps } from "@/types/geo";
import {
  buildMentionProviderRows,
  mentionOverviewTotals,
  mentionStatTrends,
  withTrackedMentionEngines,
} from "@/utils/geo-charts";

const REVEAL_SPRING = { type: "spring", duration: 0.3, bounce: 0 } as const;
const REVEAL_STAGGER = 0.08;
const OVERLAY_HIDDEN = {
  opacity: 0,
  y: -4,
  filter: "blur(4px)",
} as const;
const OVERLAY_VISIBLE = {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
} as const;
const OVERLAY_CLASS =
  "absolute top-full -right-4 -left-4 z-20 rounded-b-xl bg-card px-4 pb-4 shadow-[0_12px_24px_-8px_oklch(0_0_0/0.14)]";

function ProviderRow({
  rank,
  family,
  totals,
  mentionDelta,
  onOpen,
}: {
  rank: number;
  family: GeoEngineFamily;
  totals: GeoEngineFamilyTotals;
  mentionDelta: number | null;
  onOpen: () => void;
}) {
  const name = engineFamilyLabel(family.family);
  const clickable = totals.mentions > 0;

  return (
    <button
      aria-disabled={!clickable}
      aria-label={
        clickable ? `Open ${name} mention breakdown` : `${name}, no mentions`
      }
      className={cn(
        "grid w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-1.5 border-b py-2 text-left transition-colors",
        clickable ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
      )}
      disabled={!clickable}
      onClick={clickable ? onOpen : undefined}
      type="button"
    >
      <span className="text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums">
        {rank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center">
          <EngineIcon engine={family.family} />
        </span>
        <span className="truncate text-sm font-medium">{name}</span>
      </span>
      <span className="flex shrink-0 items-center justify-end gap-2">
        <span
          className={cn(
            "text-sm tabular-nums",
            totals.mentions === 0 && "text-muted-foreground"
          )}
        >
          {totals.mentions.toLocaleString()}
        </span>
        <GeoStatDelta
          delta={mentionDelta}
          label={`${name} mentions`}
          variant="plain"
        />
      </span>
    </button>
  );
}

function ProviderList({
  rows,
  startRank,
  onOpen,
}: {
  rows: readonly MentionProviderRow[];
  startRank: number;
  onOpen: (family: GeoEngineFamily) => void;
}) {
  return (
    <>
      {rows.map((row, index) => (
        <ProviderRow
          family={row.family}
          key={row.family.family}
          mentionDelta={row.mentionDelta}
          onOpen={() => onOpen(row.family)}
          rank={startRank + index}
          totals={row.totals}
        />
      ))}
    </>
  );
}

function ProviderToggle({
  expanded,
  hiddenCount,
  onToggle,
}: {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      aria-expanded={expanded}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mx-4 -mb-4 flex min-h-10 w-[calc(100%+2rem)] items-center justify-between pr-6 pl-9 text-sm transition-colors outline-none focus-visible:ring-2"
      onClick={onToggle}
      type="button"
    >
      {expanded
        ? GEO_MENTION_SUMMARY_LESS
        : `Tracking ${hiddenCount.toLocaleString()} more`}
      <HugeiconsIcon
        className={cn(
          "transition-transform duration-200 ease-out",
          expanded && "rotate-180"
        )}
        icon={ArrowDown01Icon}
        size={12}
      />
    </button>
  );
}

function ProviderOverlay({
  rows,
  startRank,
  expanded,
  onOpen,
  onToggle,
}: {
  rows: readonly MentionProviderRow[];
  startRank: number;
  expanded: boolean;
  onOpen: (family: GeoEngineFamily) => void;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return expanded ? (
      <div className={OVERLAY_CLASS}>
        <ProviderList onOpen={onOpen} rows={rows} startRank={startRank} />
        <ProviderToggle
          expanded
          hiddenCount={rows.length}
          onToggle={onToggle}
        />
      </div>
    ) : null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {expanded ? (
          <m.div
            animate={OVERLAY_VISIBLE}
            className={OVERLAY_CLASS}
            exit={OVERLAY_HIDDEN}
            initial={OVERLAY_HIDDEN}
            key="mention-providers"
            transition={REVEAL_SPRING}
          >
            {rows.map((row, index) => (
              <m.div
                animate={OVERLAY_VISIBLE}
                exit={{
                  ...OVERLAY_HIDDEN,
                  transition: { duration: 0.15, ease: EASE_OUT },
                }}
                initial={OVERLAY_HIDDEN}
                key={row.family.family}
                transition={{
                  ...REVEAL_SPRING,
                  delay: index * REVEAL_STAGGER,
                }}
              >
                <ProviderRow
                  family={row.family}
                  mentionDelta={row.mentionDelta}
                  onOpen={() => onOpen(row.family)}
                  rank={startRank + index}
                  totals={row.totals}
                />
              </m.div>
            ))}
            <ProviderToggle
              expanded
              hiddenCount={rows.length}
              onToggle={onToggle}
            />
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
}

export function MentionRateCard({
  engines,
  trackedEngines,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  isScanning = false,
  organizationSlug,
}: MentionRateCardProps) {
  const ranked = useMemo(
    () =>
      buildMentionProviderRows(engines, {
        trackedEngines,
        timeseriesPoints,
      }),
    [engines, trackedEngines, timeseriesPoints]
  );
  const visible = ranked.slice(0, GEO_MENTION_SUMMARY_VISIBLE);
  const hidden = ranked.slice(GEO_MENTION_SUMMARY_VISIBLE);
  const totals = mentionOverviewTotals(
    withTrackedMentionEngines(engines, trackedEngines)
  );
  const overviewDelta = mentionStatTrends(timeseriesPoints).mentionDelta;
  const [selected, setSelected] = useState<GeoEngineFamily | null>(null);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const node = rootRef.current;
      if (node && !node.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return (
    <div className="relative h-full" ref={rootRef}>
      <InstrumentModule
        bodyClassName={cn(expanded && "rounded-b-none")}
        className={cn("h-full overflow-visible", expanded && "rounded-b-none")}
        eyebrow={GEO_MENTIONS_LABEL}
        variant="table"
      >
        {ranked.length === 0 || !totals ? (
          <InstrumentEmpty
            busy={isScanning}
            className="h-40"
            message={geoScanEmptyMessage(isScanning, "No scans yet")}
            seed="Mentions"
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
                {totals.mentions.toLocaleString()}
              </p>
              <GeoStatDelta
                className="mb-0.5"
                delta={overviewDelta}
                hint={GEO_FAMILY_STAT_TREND_HINT}
                label={GEO_MENTIONS_LABEL}
                variant="plain"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-sm font-medium">
                <span>Provider</span>
                <span>Mentions</span>
              </div>
              <div className="border-border relative [&>button:last-of-type]:border-b-0">
                <ProviderList
                  onOpen={setSelected}
                  rows={visible}
                  startRank={1}
                />
                {hidden.length > 0 ? (
                  <>
                    {expanded ? null : (
                      <ProviderToggle
                        expanded={false}
                        hiddenCount={hidden.length}
                        onToggle={() => setExpanded(true)}
                      />
                    )}
                    <ProviderOverlay
                      expanded={expanded}
                      onOpen={setSelected}
                      onToggle={() => setExpanded(false)}
                      rows={hidden}
                      startRank={GEO_MENTION_SUMMARY_VISIBLE + 1}
                    />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
        <EngineFamilySheet
          family={selected}
          onOpenChange={(open) => {
            if (!open) {
              setSelected(null);
            }
          }}
          open={selected !== null}
          organizationSlug={organizationSlug}
          promptResults={promptResults}
          timeseriesPoints={timeseriesPoints}
        />
      </InstrumentModule>
    </div>
  );
}
