"use client";

import { Activity, useState } from "react";

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
  const showBoard = view === "board" && totalCount > 0;
  const [boardMounted, setBoardMounted] = useState(showBoard);

  if (showBoard && !boardMounted) {
    setBoardMounted(true);
  }

  return (
    <>
      <Activity mode={showBoard ? "hidden" : "visible"}>
        <ShelfTable
          hasScanData={hasScanData}
          onAddShelf={onAddShelf}
          onRowClick={onRowClick}
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
          />
        </Activity>
      ) : null}
    </>
  );
}
