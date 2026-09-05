"use client";

import { ShelfToolbar } from "@/components/geo/shelf/shelf-toolbar";
import { ShelfViewToggle } from "@/components/geo/shelf/shelf-view-toggle";
import type { GeoShelfPageControlsProps } from "@/types/geo-shelf";

export function ShelfPageControls({
  hasRows,
  view,
  onViewChange,
  filters,
  onSearchChange,
  onShelfFilterChange,
  onTicketFilterChange,
}: GeoShelfPageControlsProps) {
  if (!hasRows) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ShelfToolbar
        filters={filters}
        onSearchChange={onSearchChange}
        onShelfFilterChange={onShelfFilterChange}
        onTicketFilterChange={onTicketFilterChange}
      />
      <ShelfViewToggle onViewChange={onViewChange} view={view} />
    </div>
  );
}
