"use client";

import { ShelfBoard } from "@/components/geo/shelf/shelf-board";
import { ShelfTable } from "@/components/geo/shelf/shelf-table";
import type { GeoShelfViewProps } from "@/types/geo-shelf";

export function ShelfView({
  view,
  rows,
  totalCount,
  currentMemberId,
  pendingSourceIds,
  hasScanData,
  onAddShelf,
  onRowClick,
  onUpdateOpportunity,
}: GeoShelfViewProps) {
  if (view === "board" && totalCount > 0) {
    return (
      <ShelfBoard
        currentMemberId={currentMemberId}
        onRowClick={onRowClick}
        onUpdateOpportunity={onUpdateOpportunity}
        pendingSourceIds={pendingSourceIds}
        rows={rows}
      />
    );
  }

  return (
    <ShelfTable
      hasScanData={hasScanData}
      onAddShelf={onAddShelf}
      onRowClick={onRowClick}
      pendingSourceIds={pendingSourceIds}
      rows={rows}
      totalCount={totalCount}
    />
  );
}
