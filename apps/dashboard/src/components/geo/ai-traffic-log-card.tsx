"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";
import { CitationsTable } from "@/components/geo/citations-table";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import {
  GEO_TRAFFIC_LOG_PURPOSE_OPTIONS,
  GEO_TRAFFIC_LOG_VISITOR_OPTIONS,
} from "@/constants/geo";
import { useGeoTrafficLog } from "@/lib/hooks/use-geo";
import type { AiTrafficLogCardProps, GeoTrafficLogFilters } from "@/types/geo";
import {
  formatGeoTrafficFilterLabel,
  toggleGeoTrafficFilterValue,
} from "@/utils/ai-traffic";
import { geoCitationsHref } from "@/utils/geo-citations";

const TRAFFIC_LOG_HEIGHT = 416;

const FILTER_TRIGGER_CLASS =
  "flex h-6 items-center gap-1 rounded-sm border border-border bg-background px-2 text-xs hover:bg-muted";

const ALL_CITATIONS_CLASS =
  "text-muted-foreground text-xs capitalize underline-offset-4 hover:text-foreground hover:underline";

export function AiTrafficLogCard({
  organizationId,
  organizationSlug,
}: AiTrafficLogCardProps) {
  const { projectId } = useGeoProjectScope();
  const [filters, setFilters] = useState<GeoTrafficLogFilters>({
    visitorTypes: [],
    categories: [],
  });
  const { data } = useGeoTrafficLog(organizationId, filters);
  const log = data?.log ?? [];
  const total = data?.total ?? log.length;

  const filterRow = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
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
        <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
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
      <Link
        className={ALL_CITATIONS_CLASS}
        href={geoCitationsHref(organizationSlug, projectId)}
      >
        All citations
      </Link>
    </div>
  );

  return (
    <InstrumentSection
      action={filterRow}
      eyebrow="Recent citations"
      readout={
        total === 0 ? "no visits yet" : `${total.toLocaleString()} requests`
      }
    >
      {log.length === 0 ? (
        <InstrumentEmpty
          message="No visits match these filters"
          seed="geo-traffic-log"
        />
      ) : (
        <CitationsTable entries={log} height={TRAFFIC_LOG_HEIGHT} />
      )}
    </InstrumentSection>
  );
}
