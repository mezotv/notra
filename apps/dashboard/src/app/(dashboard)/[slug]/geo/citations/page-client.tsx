"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { CitationsEmpty } from "@/components/geo/citations-empty";
import { CitationsTable } from "@/components/geo/citations-table";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import {
  GEO_CITATIONS_FETCH_LIMIT,
  GEO_CITATIONS_LIVE_INTERVAL_MS,
  GEO_CITATIONS_PAGE_SIZE,
  GEO_CITATIONS_TABLE_HEIGHT,
} from "@/constants/geo";
import { useGeoSettings, useGeoTrafficLog } from "@/lib/hooks/use-geo";
import type { GeoTrafficLogFilters } from "@/types/geo";
import {
  citationPageCount,
  citationPageRows,
  formatCitationRange,
} from "@/utils/geo-citations";
import { GeoPageSkeleton } from "../skeleton";

const EMPTY_FILTERS: GeoTrafficLogFilters = {
  visitorTypes: [],
  categories: [],
};

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const [projectParam] = useQueryState("project", parseAsString);

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <CitationsPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function CitationsPageContent({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending } = useGeoSettings(organizationId);
  const [rawPage, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );
  const [live, setLive] = useState(true);

  const { data, isFetching } = useGeoTrafficLog(organizationId, EMPTY_FILTERS, {
    limit: GEO_CITATIONS_FETCH_LIMIT,
    refetchInterval: live ? GEO_CITATIONS_LIVE_INTERVAL_MS : false,
  });

  const log = data?.log ?? [];
  const total = data?.total ?? log.length;
  const totalPages = citationPageCount(total, GEO_CITATIONS_PAGE_SIZE);
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const pageRows = citationPageRows(log, page, GEO_CITATIONS_PAGE_SIZE);
  const countLabel = total > 0 ? ` (${total.toLocaleString()})` : "";

  if (isPending) {
    return <GeoPageSkeleton />;
  }

  if (!settingsData?.settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">
              Recent citations
            </h1>
            <p className="text-muted-foreground">
              Live requests from AI crawlers and assistants hitting your site
            </p>
          </header>
          <EmptyState
            action={
              <Button render={<Link href={`/${organizationSlug}/geo`} />}>
                Set up GEO tracking
              </Button>
            }
            description="Set up GEO tracking first, then watch AI crawlers and citations as they arrive."
            preview={
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.citations}
                rows={EMPTY_STATE_TABLE_ROWS}
              />
            }
            title="Not set up yet"
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">
              Recent citations{countLabel}
            </h1>
            <p className="text-muted-foreground">
              Live requests from AI crawlers and assistants hitting your site
            </p>
          </div>
          <Button
            onClick={() => setLive((current) => !current)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon
              icon={live ? PauseIcon : PlayIcon}
              size={14}
              strokeWidth={2}
            />
            {live ? "Pause live updates" : "Resume live updates"}
          </Button>
        </header>
        {total === 0 ? (
          <CitationsEmpty organizationId={organizationId} />
        ) : (
          <div className="flex flex-col gap-3">
            <CitationsTable
              entries={pageRows}
              height={GEO_CITATIONS_TABLE_HEIGHT}
              loading={isFetching && pageRows.length === 0}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
              <span>
                {formatCitationRange(page, GEO_CITATIONS_PAGE_SIZE, total)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                </Button>
                <span className="tabular-nums">
                  Page {page.toLocaleString()} of {totalPages.toLocaleString()}
                </span>
                <Button
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
