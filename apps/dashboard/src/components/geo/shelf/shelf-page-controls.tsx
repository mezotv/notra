"use client";

import { ButtonGroup } from "@notra/ui/components/ui/button-group";
import { Columns3Icon, Table2Icon } from "lucide-react";

import { Button } from "@/components/button";
import { ShelfToolbar } from "@/components/geo/shelf/shelf-toolbar";
import type { GeoShelfPageControlsProps } from "@/types/geo-shelf";
import { setGeoShelfView } from "@/utils/geo-shelf-view";

export function ShelfPageControls({
  hasRows,
  view,
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
      <ButtonGroup aria-label="Shelf view">
        <Button
          aria-label="Table view"
          aria-pressed={view === "table"}
          onClick={() => setGeoShelfView("table")}
          size="icon"
          variant={view === "table" ? "secondary" : "outline"}
        >
          <Table2Icon />
        </Button>
        <Button
          aria-label="Board view"
          aria-pressed={view === "board"}
          onClick={() => setGeoShelfView("board")}
          size="icon"
          variant={view === "board" ? "secondary" : "outline"}
        >
          <Columns3Icon />
        </Button>
      </ButtonGroup>
    </div>
  );
}
