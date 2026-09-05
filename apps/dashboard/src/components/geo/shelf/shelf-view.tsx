"use client";

import { Activity, useState } from "react";

import { ShelfBoard } from "@/components/geo/shelf/shelf-board";
import { ShelfTable } from "@/components/geo/shelf/shelf-table";
import type { GeoShelfViewProps } from "@/types/geo-shelf";

export function ShelfView({
  view,
  rows,
  totalCount,
  ticketFilter,
  currentMemberId,
  pendingSourceIds,
  hasScanData,
  onAddShelf,
  onRowClick,
  onUpdateOpportunity,
  onSetPlacementStatus,
}: GeoShelfViewProps) {
  const showBoard = view === "board" && totalCount > 0;
  const [boardMounted, setBoardMounted] = useState(showBoard);

  if (showBoard && !boardMounted) {
    setBoardMounted(true);
  }

  return (
    <>
      <Activity mode={showBoard ? "hidden" : "visible"}>
        <ShelfTable
          currentMemberId={currentMemberId}
          hasScanData={hasScanData}
          onAddShelf={onAddShelf}
          onRowClick={onRowClick}
          onSetPlacementStatus={onSetPlacementStatus}
          onUpdateOpportunity={onUpdateOpportunity}
          pendingSourceIds={pendingSourceIds}
          rows={rows}
          totalCount={totalCount}
        />
      </Activity>
      {boardMounted ? (
        <Activity mode={showBoard ? "visible" : "hidden"}>
          <ShelfBoard
            currentMemberId={currentMemberId}
            onRowClick={onRowClick}
            onUpdateOpportunity={onUpdateOpportunity}
            pendingSourceIds={pendingSourceIds}
            rows={rows}
            ticketFilter={ticketFilter}
          />
        </Activity>
      ) : null}
    </>
  );
}
