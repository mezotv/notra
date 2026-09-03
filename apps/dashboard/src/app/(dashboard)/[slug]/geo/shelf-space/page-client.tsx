"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { ShelfAddDialog } from "@/components/geo/shelf/shelf-add-dialog";
import { ShelfDetailDialog } from "@/components/geo/shelf/shelf-detail-dialog";
import { ShelfKanban } from "@/components/geo/shelf/shelf-kanban";
import { ShelfTable } from "@/components/geo/shelf/shelf-table";
import { ShelfToolbar } from "@/components/geo/shelf/shelf-toolbar";
import { PageContainer } from "@/components/layout/container";
import {
  GeoProjectProvider,
  useGeoProjectScope,
} from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import {
  GEO_SHELF_ADD_HOTKEY,
  GEO_SHELF_SHELF_FILTERS,
  GEO_SHELF_TICKET_FILTERS,
} from "@/constants/geo-shelf";
import { useGeoSettings } from "@/lib/hooks/use-geo";
import { useGeoActiveProject } from "@/lib/hooks/use-geo-active-project";
import { useGeoCompetitorsDb, useGeoShelfDb } from "@/lib/hooks/use-geo-db";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useGeoShelfMembers } from "@/lib/hooks/use-geo-shelf";
import { useGeoShelfView } from "@/lib/hooks/use-geo-shelf-view";
import type { GeoPageClientProps } from "@/types/geo";
import type { GeoShelfPageContentProps } from "@/types/geo-shelf";
import { withGeoProject } from "@/utils/geo-paths";
import {
  buildOptimisticShelfSource,
  filterShelfRows,
  toShelfRows,
} from "@/utils/geo-shelf";

import { GeoShelfSkeleton } from "./skeleton";

const PAGE_TITLE = "Shelf Space";
const PAGE_DESCRIPTION =
  "Third-party pages AI engines cite for your prompts, and whether you're on them";

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useGeoProjectQueryState();

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <GeoShelfPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function GeoShelfPageContent({ organizationSlug }: GeoShelfPageContentProps) {
  const { projectId } = useGeoProjectScope();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const { competitors } = useGeoCompetitorsDb(organizationId);
  const { domain: ownDomain } = useGeoActiveProject(organizationId);
  const membersQuery = useGeoShelfMembers(organizationId);
  const shelf = useGeoShelfDb(organizationId);

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [shelfFilter, setShelfFilter] = useQueryState(
    "shelf",
    parseAsStringLiteral(GEO_SHELF_SHELF_FILTERS)
      .withDefault("all")
      .withOptions({ clearOnDefault: true })
  );
  const [ticketFilter, setTicketFilter] = useQueryState(
    "ticket",
    parseAsStringLiteral(GEO_SHELF_TICKET_FILTERS)
      .withDefault("any")
      .withOptions({ clearOnDefault: true })
  );
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useGeoShelfView();

  useHotkey(GEO_SHELF_ADD_HOTKEY, () => setAddOpen(true), {
    enabled: !addOpen && selectedId === null,
  });

  if (isSettingsPending) {
    return <GeoShelfSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{PAGE_TITLE}</h1>
            <p className="text-muted-foreground">{PAGE_DESCRIPTION}</p>
          </header>
          <EmptyState
            action={
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={withGeoProject(`/${organizationSlug}/geo`, projectId)}
                  />
                }
              >
                Set up GEO tracking
              </Button>
            }
            description="Set up GEO tracking first, then see which pages engines cite and who is listed on them."
            preview={
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.shelf}
                rows={EMPTY_STATE_TABLE_ROWS}
              />
            }
            title="Not set up yet"
          />
        </div>
      </PageContainer>
    );
  }

  const members = membersQuery.data?.members ?? [];
  const currentMemberId = membersQuery.data?.currentMemberId ?? null;
  const currentMember =
    members.find((member) => member.id === currentMemberId) ?? null;
  const ownBrandName = settings.companyName;
  const rows = toShelfRows(shelf.sources, members);
  const filters = {
    search,
    shelf: shelfFilter,
    ticket: ticketFilter,
    currentMemberId,
  };
  const filteredRows = filterShelfRows(rows, filters);
  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{PAGE_TITLE}</h1>
            <p className="text-muted-foreground">{PAGE_DESCRIPTION}</p>
          </div>
          <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add shelf
            <Kbd className="ml-1 hidden sm:inline-flex">
              {GEO_SHELF_ADD_HOTKEY}
            </Kbd>
          </Button>
        </header>

        <div className="space-y-3">
          {rows.length > 0 ? (
            <ShelfToolbar
              filters={filters}
              onSearchChange={setSearch}
              onShelfFilterChange={setShelfFilter}
              onTicketFilterChange={setTicketFilter}
              onViewChange={setView}
              view={view}
            />
          ) : null}
          {view === "board" && rows.length > 0 ? (
            <ShelfKanban
              currentMemberId={currentMemberId}
              onOpenRow={(row) => setSelectedId(row.id)}
              onUpdateOpportunity={shelf.updateOpportunity}
              pendingSourceIds={shelf.pendingSourceIds}
              rows={filteredRows}
            />
          ) : (
            <ShelfTable
              hasScanData={shelf.sources.some(
                (source) => source.origin === "scan"
              )}
              onAddShelf={() => setAddOpen(true)}
              onRowClick={(row) => setSelectedId(row.id)}
              pendingSourceIds={shelf.pendingSourceIds}
              rows={filteredRows}
              totalCount={rows.length}
            />
          )}
        </div>
      </div>

      <ShelfDetailDialog
        currentMemberId={currentMemberId}
        isPending={selectedId ? shelf.pendingSourceIds.has(selectedId) : false}
        members={members}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
        onSetPlacementStatus={shelf.setPlacementStatus}
        onUpdateOpportunity={shelf.updateOpportunity}
        open={selectedRow !== null}
        ownBrandName={ownBrandName}
        row={selectedRow}
      />

      <ShelfAddDialog
        competitors={competitors}
        currentMemberId={currentMemberId}
        members={members}
        onOpenChange={setAddOpen}
        organizationId={organizationId}
        onSubmit={(draft) => {
          shelf.addSource(
            buildOptimisticShelfSource(draft, {
              ownBrandName,
              ownDomain,
              competitors,
              createdByUserId: currentMember?.userId ?? null,
            })
          );
        }}
        open={addOpen}
        ownBrandName={ownBrandName}
      />
    </PageContainer>
  );
}
