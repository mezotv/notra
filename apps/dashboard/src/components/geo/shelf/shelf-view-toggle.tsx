"use client";

import { KanbanIcon, Table01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ButtonGroup } from "@notra/ui/components/ui/button-group";

import { Button } from "@/components/button";
import { GEO_SHELF_VIEW_LABELS, GEO_SHELF_VIEWS } from "@/constants/geo-shelf";
import type { GeoShelfViewToggleProps } from "@/types/geo-shelf";

const VIEW_ICONS = {
  table: Table01Icon,
  board: KanbanIcon,
} as const;

export function ShelfViewToggle({ value, onChange }: GeoShelfViewToggleProps) {
  return (
    <ButtonGroup aria-label="Shelf view">
      {GEO_SHELF_VIEWS.map((view) => {
        const active = view === value;
        return (
          <Button
            aria-pressed={active}
            className="gap-1.5"
            key={view}
            onClick={() => onChange(view)}
            size="sm"
            variant={active ? "secondary" : "outline"}
          >
            <HugeiconsIcon className="size-4" icon={VIEW_ICONS[view]} />
            {GEO_SHELF_VIEW_LABELS[view]}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
