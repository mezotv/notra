"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useMemo } from "react";

import { Button } from "@/components/button";
import { EngineIcon } from "@/components/geo/engine-icon";
import { JourneyPathTrail } from "@/components/geo/journey-path-trail";
import { CountryFlag } from "@/components/geo/twemoji";
import { GEO_JOURNEY_TRAIL_DETAIL_LIMIT } from "@/constants/geo";
import { useGeoJourneyDetail } from "@/lib/hooks/use-geo";
import type { JourneyDetailDialogProps } from "@/types/geo";
import { formatGeoJourneySpan, formatGeoSource } from "@/utils/ai-traffic";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { countryName } from "@/utils/country";
import {
  formatGeoJourneyClock,
  formatGeoRefererSource,
  hasGeoJourneyReferers,
} from "@/utils/geo-journey";

const JOURNEY_EVENT_SKELETON_ROW_KEYS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
] as const;

function JourneyEventSkeletonRows({
  rows,
  showReferer,
}: {
  rows: number;
  showReferer: boolean;
}) {
  return JOURNEY_EVENT_SKELETON_ROW_KEYS.slice(0, rows).map((key) => (
    <TableRow key={key}>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      {showReferer ? (
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ) : null}
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  ));
}

export function JourneyDetailDialog({
  open,
  onOpenChange,
  organizationId,
  journey,
}: JourneyDetailDialogProps) {
  const { data, isLoading } = useGeoJourneyDetail(
    organizationId,
    open ? (journey?.journeyId ?? null) : null
  );

  const events = useMemo(() => data?.events ?? [], [data]);
  const eventPaths = useMemo(() => events.map((event) => event.path), [events]);

  if (!journey) {
    return null;
  }

  const showReferer = isLoading
    ? journey.visitorType !== "crawler"
    : hasGeoJourneyReferers(events);
  const skeletonRows = Math.min(
    Math.max(journey.pages, 1),
    JOURNEY_EVENT_SKELETON_ROW_KEYS.length
  );

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-3xl [&>*]:min-w-0">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Agent journey</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            How this agent moved through your site, one fetch at a time.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 font-mono text-xs">
              {journey.journeyId}
            </span>
            <Button
              aria-label="Copy journey id"
              onClick={() => copyToClipboard(journey.journeyId)}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
            </Button>
            <span className="inline-flex items-center gap-2 text-sm">
              <EngineIcon engine={journey.source} />
              {formatGeoSource(journey.source, journey.visitorType)}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-xs">Visitor</dt>
              <dd className="text-sm">
                {journey.visitorType === "crawler" ? "Crawler" : "AI referral"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Span</dt>
              <dd className="text-sm tabular-nums">
                {formatGeoJourneySpan(journey.firstSeenAt, journey.lastSeenAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Pages</dt>
              <dd className="text-sm tabular-nums">{journey.pages}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Unique paths</dt>
              <dd className="text-sm tabular-nums">{journey.distinctPaths}</dd>
            </div>
          </dl>
          {isLoading ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {JOURNEY_EVENT_SKELETON_ROW_KEYS.slice(0, skeletonRows).map(
                (key) => (
                  <Skeleton className="h-5 w-20 rounded-full" key={key} />
                )
              )}
            </div>
          ) : eventPaths.length > 0 ? (
            <JourneyPathTrail
              limit={GEO_JOURNEY_TRAIL_DETAIL_LIMIT}
              paths={eventPaths}
            />
          ) : (
            <JourneyPathTrail
              limit={GEO_JOURNEY_TRAIL_DETAIL_LIMIT}
              paths={journey.samplePaths}
            />
          )}
          <div aria-busy={isLoading} className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Path</TableHead>
                  {showReferer && <TableHead>Referer</TableHead>}
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <JourneyEventSkeletonRows
                    rows={skeletonRows}
                    showReferer={showReferer}
                  />
                ) : null}
                {!isLoading && events.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      colSpan={showReferer ? 4 : 3}
                    >
                      No events captured for this journey
                    </TableCell>
                  </TableRow>
                )}
                {events.map((event) => (
                  <TableRow key={`${event.capturedAt}-${event.path}`}>
                    <TableCell className="text-muted-foreground text-[0.6875rem] whitespace-nowrap tabular-nums">
                      {formatGeoJourneyClock(event.capturedAt)}
                    </TableCell>
                    <TableCell
                      className="max-w-[22rem] truncate font-mono text-xs"
                      title={event.path}
                    >
                      {event.path}
                    </TableCell>
                    {showReferer && (
                      <TableCell className="text-sm">
                        {formatGeoRefererSource(event.referer)}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      {event.country ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <CountryFlag
                            className="size-4 shrink-0"
                            code={event.country}
                          />
                          <span className="truncate">
                            {countryName(event.country)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
