"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import { Badge } from "@notra/ui/components/ui/badge";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { EngineIcon } from "@/components/geo/engine-icon";
import { LogoStack } from "@/components/geo/logo-stack";
import { ShelfMemberAvatar } from "@/components/geo/shelf/shelf-member-avatar";
import { ShelfPlacementBadge } from "@/components/geo/shelf/shelf-placement-badge";
import { ShelfTicketBadge } from "@/components/geo/shelf/shelf-ticket-badge";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import {
  GEO_SHELF_COMPETITOR_STACK_LIMIT,
  GEO_SHELF_ENGINE_STACK_LIMIT,
  GEO_SHELF_SOURCE_KIND_LABELS,
  GEO_SHELF_TABLE_HEIGHT,
  GEO_SHELF_TABLE_ROW_HEIGHT,
} from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type { GeoShelfRow, GeoShelfTableProps } from "@/types/geo-shelf";
import { formatRelative } from "@/utils/format-relative";

function PageCell({ row }: { row: GeoShelfRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <CompetitorLogo
        className="size-6 shrink-0 rounded-md"
        domain={row.domain}
        name={row.domain}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium" title={row.title ?? row.url}>
          {row.title ?? row.url}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {row.domain}
          {row.origin === "manual" ? " · added manually" : ""}
        </span>
      </span>
    </span>
  );
}

function EnginesCell({ row }: { row: GeoShelfRow }) {
  if (row.citations.engines.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <LogoStack
      items={row.citations.engines.map((engine) => ({
        key: engine,
        label: engineFamilyLabel(engine),
        detail: engine,
        renderIcon: (className) => (
          <EngineIcon className={className} engine={engine} />
        ),
      }))}
      limit={GEO_SHELF_ENGINE_STACK_LIMIT}
    />
  );
}

function CompetitorsCell({ row }: { row: GeoShelfRow }) {
  if (row.presentCompetitors.length === 0) {
    const unknownCount = row.competitorPlacements.filter(
      (placement) => placement.status === "unknown"
    ).length;
    return (
      <span className="text-muted-foreground text-xs">
        {unknownCount > 0 ? "Not checked" : "None"}
      </span>
    );
  }
  return (
    <LogoStack
      items={row.presentCompetitors.map((placement) => ({
        key: placement.competitorId ?? placement.brandName,
        label: placement.brandName,
        detail: placement.position
          ? `#${placement.position} on the page`
          : null,
        renderIcon: (className) => (
          <CompetitorLogo
            className={cn(className, "rounded-md")}
            domain={placement.brandDomain}
            name={placement.brandName}
          />
        ),
      }))}
      limit={GEO_SHELF_COMPETITOR_STACK_LIMIT}
    />
  );
}

function TicketCell({ row }: { row: GeoShelfRow }) {
  if (!row.opportunity) {
    return <span className="text-muted-foreground text-xs">No ticket</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ShelfTicketBadge status={row.opportunity.status} />
      <ShelfMemberAvatar
        className="min-w-0"
        fallbackLabel="Unassigned"
        member={row.assignee}
      />
    </span>
  );
}

export function ShelfTable({
  rows,
  totalCount,
  onRowClick,
  pendingSourceIds,
  hasScanData,
  onAddShelf,
}: GeoShelfTableProps) {
  const columns: TableColumn<GeoShelfRow>[] = [
    {
      key: "title",
      header: (
        <span className="inline-flex items-center gap-1.5">
          Page
          <span className="text-muted-foreground font-normal tabular-nums">
            ({rows.length})
          </span>
        </span>
      ),
      sortable: true,
      width: "2fr",
      cell: (row) => <PageCell row={row} />,
      sortValue: (row) => row.title ?? row.url,
    },
    {
      key: "kind",
      header: "Kind",
      width: "7rem",
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary">
          {GEO_SHELF_SOURCE_KIND_LABELS[row.kind]}
        </Badge>
      ),
    },
    {
      key: "citations",
      header: "Cited 30d",
      width: "6.5rem",
      align: "right",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums">
          {row.citations.windowCount > 0 ? row.citations.windowCount : "-"}
        </span>
      ),
      sortValue: (row) => row.citations.windowCount,
    },
    {
      key: "engines",
      header: "Engines",
      width: "7rem",
      cell: (row) => <EnginesCell row={row} />,
      sortValue: (row) => row.citations.engines.length,
    },
    {
      key: "own",
      header: "You",
      width: "7.5rem",
      sortable: true,
      cell: (row) => (
        <ShelfPlacementBadge
          evidence={row.ownPlacement?.evidence}
          status={row.ownPlacement?.status ?? null}
        />
      ),
      sortValue: (row) => row.ownPlacement?.status ?? "unknown",
    },
    {
      key: "competitors",
      header: "Competitors on it",
      width: "9rem",
      cell: (row) => <CompetitorsCell row={row} />,
      sortValue: (row) => row.presentCompetitors.length,
    },
    {
      key: "ticket",
      header: "Ticket",
      width: "1.4fr",
      sortable: true,
      cell: (row) => <TicketCell row={row} />,
      sortValue: (row) => row.opportunity?.status ?? "zz",
    },
    {
      key: "updatedAt",
      header: "Updated",
      width: "6.5rem",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground text-xs">
          {formatRelative(row.updatedAt)}
        </span>
      ),
      sortValue: (row) => row.updatedAt,
    },
  ];

  if (totalCount === 0) {
    return (
      <EmptyState
        action={
          <Button className="gap-1.5" onClick={onAddShelf}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add a shelf
          </Button>
        }
        description={
          hasScanData
            ? "No cited pages yet. Add the pages you want to be on, or wait for the next scan."
            : "Run a scan to see which pages AI engines cite for your prompts, or add a page you want to be listed on."
        }
        preview={
          <EmptyStateTablePreview
            columns={EMPTY_STATE_TABLE_COLUMNS.shelf}
            rows={EMPTY_STATE_TABLE_ROWS}
          />
        }
        title="No shelf space tracked yet"
      />
    );
  }

  return (
    <Table
      className="rounded-2xl"
      columns={columns}
      data={rows}
      defaultSort={{ key: "citations", direction: "desc" }}
      emptyState="No shelves match these filters"
      getRowId={(row) => row.id}
      height={GEO_SHELF_TABLE_HEIGHT}
      isRowPinned={(row) => pendingSourceIds.has(row.id)}
      onRowClick={onRowClick}
      resizable
      rowHeight={GEO_SHELF_TABLE_ROW_HEIGHT}
    />
  );
}
