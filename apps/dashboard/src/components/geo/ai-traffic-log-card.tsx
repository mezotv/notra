"use client";

import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/button";
import { CitationsTable } from "@/components/geo/citations-table";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import {
  GEO_CITATIONS_LIVE_INTERVAL_MS,
  GEO_TRAFFIC_LOG_PURPOSE_OPTIONS,
  GEO_TRAFFIC_LOG_VISITOR_OPTIONS,
} from "@/constants/geo";
import { useGeoTrafficLog } from "@/lib/hooks/use-geo";
import type { AiTrafficLogCardProps, GeoTrafficLogFilters } from "@/types/geo";
import {
  formatGeoTrafficFilterLabel,
  toggleGeoTrafficFilterValue,
} from "@/utils/ai-traffic";

const TRAFFIC_LOG_HEIGHT = 416;
const LOG_SKELETON_ROWS = 6;

export function AiTrafficLogCard({ organizationId }: AiTrafficLogCardProps) {
  const [filters, setFilters] = useState<GeoTrafficLogFilters>({
    visitorTypes: [],
    categories: [],
  });
  const [live, setLive] = useState(true);
  const { data, isPending } = useGeoTrafficLog(organizationId, filters, {
    refetchInterval: live ? GEO_CITATIONS_LIVE_INTERVAL_MS : false,
  });
  const log = data?.log ?? [];
  const total = data?.total ?? log.length;
  let readout: string | undefined;
  if (!isPending) {
    readout =
      total === 0 ? "no visits yet" : `${total.toLocaleString()} requests`;
  }

  let body: ReactNode;
  if (isPending) {
    body = <GeoTableSkeleton rows={LOG_SKELETON_ROWS} />;
  } else if (log.length === 0) {
    body = (
      <InstrumentEmpty
        message="No visits match these filters"
        seed="geo-traffic-log"
      />
    );
  } else {
    body = <CitationsTable entries={log} height={TRAFFIC_LOG_HEIGHT} />;
  }

  const filterRow = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          {formatGeoTrafficFilterLabel(
            "All visitors",
            "visitors",
            filters.visitorTypes,
            GEO_TRAFFIC_LOG_VISITOR_OPTIONS
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {GEO_TRAFFIC_LOG_VISITOR_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              checked={filters.visitorTypes.includes(option.value)}
              key={option.value}
              onCheckedChange={() => {
                setFilters((previous) => ({
                  ...previous,
                  visitorTypes: toggleGeoTrafficFilterValue(
                    previous.visitorTypes,
                    option.value
                  ),
                }));
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          {formatGeoTrafficFilterLabel(
            "All purposes",
            "purposes",
            filters.categories,
            GEO_TRAFFIC_LOG_PURPOSE_OPTIONS
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {GEO_TRAFFIC_LOG_PURPOSE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              checked={filters.categories.includes(option.value)}
              key={option.value}
              onCheckedChange={() => {
                setFilters((previous) => ({
                  ...previous,
                  categories: toggleGeoTrafficFilterValue(
                    previous.categories,
                    option.value
                  ),
                }));
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {total > 0 && (
        <Button
          onClick={() => setLive((current) => !current)}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon
            data-icon="inline-start"
            icon={live ? PauseIcon : PlayIcon}
            strokeWidth={2}
          />
          {live ? "Pause live updates" : "Resume live updates"}
        </Button>
      )}
    </div>
  );

  return (
    <InstrumentSection
      action={filterRow}
      eyebrow="Recent citations"
      readout={readout}
    >
      {body}
    </InstrumentSection>
  );
}
