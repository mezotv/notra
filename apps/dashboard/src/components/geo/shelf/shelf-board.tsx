"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useMemo, useRef, useState } from "react";

import { ShelfMemberAvatar } from "@/components/geo/shelf/shelf-member-avatar";
import { ShelfPlacementBadge } from "@/components/geo/shelf/shelf-placement-badge";
import { ShelfTicketBadge } from "@/components/geo/shelf/shelf-ticket-badge";
import {
  GEO_SHELF_BOARD_CARD_HEIGHT,
  GEO_SHELF_BOARD_COLUMNS,
  GEO_SHELF_BOARD_COLUMN_HEADER_HEIGHT,
  GEO_SHELF_BOARD_COLUMN_SCROLL_HEIGHT,
  GEO_SHELF_BOARD_COLUMN_WIDTH,
  GEO_SHELF_BOARD_HEIGHT,
  GEO_SHELF_BOARD_OVERSCAN,
  GEO_SHELF_NO_MATCHES_MESSAGE,
} from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type {
  GeoShelfBoardColumnId,
  GeoShelfBoardProps,
  GeoShelfRow,
} from "@/types/geo-shelf";
import { groupRowsByBoardColumn } from "@/utils/geo-shelf";

const POINTER_ACTIVATION_DISTANCE = 8;
const TOUCH_ACTIVATION_DELAY_MS = 150;
const TOUCH_ACTIVATION_TOLERANCE = 8;
const UNTRACKED_COLUMN: GeoShelfBoardColumnId = "untracked";

const BOARD_SENSORS = {
  mouse: { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE } },
  touch: {
    activationConstraint: {
      delay: TOUCH_ACTIVATION_DELAY_MS,
      tolerance: TOUCH_ACTIVATION_TOLERANCE,
    },
  },
} as const;

function columnFromDropId(
  id: string | number | undefined
): GeoShelfBoardColumnId | null {
  const match = GEO_SHELF_BOARD_COLUMNS.find((column) => column.id === id);
  return match ? (match.id as GeoShelfBoardColumnId) : null;
}

const ShelfBoardCard = memo(function ShelfBoardCard({
  row,
  disabled,
  onActivate,
}: {
  row: GeoShelfRow;
  disabled: boolean;
  onActivate: (row: GeoShelfRow) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.id,
    disabled,
  });
  const title = row.title ?? row.domain;

  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={title}
      className={cn(
        "bg-background w-full rounded-lg border p-3 text-left shadow-sm outline-none",
        disabled
          ? "cursor-default opacity-60"
          : "cursor-grab active:cursor-grabbing",
        isDragging
          ? "opacity-30"
          : "focus-visible:ring-ring focus-visible:ring-2"
      )}
      onClick={() => {
        if (!isDragging) {
          onActivate(row);
        }
      }}
      ref={setNodeRef}
      type="button"
    >
      <ShelfBoardCardBody row={row} />
    </button>
  );
});

const ShelfBoardCardBody = memo(function ShelfBoardCardBody({
  row,
}: {
  row: GeoShelfRow;
}) {
  const title = row.title ?? row.domain;
  return (
    <div className="space-y-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{row.domain}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {row.opportunity ? (
          <ShelfTicketBadge status={row.opportunity.status} />
        ) : (
          <span className="text-muted-foreground text-xs">No ticket</span>
        )}
        <ShelfPlacementBadge
          evidence={row.ownPlacement?.evidence}
          status={row.ownPlacement?.status ?? null}
          tooltip={false}
        />
      </div>
      <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
        <ShelfMemberAvatar
          className="min-w-0 gap-1.5"
          member={row.assignee}
          size="sm"
        />
        <span className="shrink-0 tabular-nums">
          {row.citations.windowCount} cited
        </span>
      </div>
    </div>
  );
});

const ShelfBoardColumn = memo(function ShelfBoardColumn({
  columnId,
  name,
  rows,
  pendingSourceIds,
  onRowClick,
}: {
  columnId: GeoShelfBoardColumnId;
  name: string;
  rows: GeoShelfRow[];
  pendingSourceIds: ReadonlySet<string>;
  onRowClick: (row: GeoShelfRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropDisabled = columnId === UNTRACKED_COLUMN;
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    disabled: dropDisabled,
  });
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => GEO_SHELF_BOARD_CARD_HEIGHT,
    getItemKey: (index) => rows[index]?.id ?? index,
    initialRect: {
      height: GEO_SHELF_BOARD_COLUMN_SCROLL_HEIGHT,
      width: GEO_SHELF_BOARD_COLUMN_WIDTH,
    },
    overscan: GEO_SHELF_BOARD_OVERSCAN,
  });

  return (
    <section
      className={cn(
        // min-h-0 keeps the column inside the board; otherwise it grows with
        // every card and the virtualizer mounts the full list.
        "bg-secondary flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-md border",
        "transition-[border-color,background-color] duration-150 ease-out",
        isOver && !dropDisabled && "border-foreground/15 bg-background/40",
        isOver && dropDisabled && "bg-muted/50"
      )}
      ref={setNodeRef}
      style={{ width: GEO_SHELF_BOARD_COLUMN_WIDTH }}
    >
      <header
        className="flex shrink-0 items-center justify-between px-3 text-sm font-semibold"
        style={{ height: GEO_SHELF_BOARD_COLUMN_HEADER_HEIGHT }}
      >
        <h2 className="text-sm font-semibold">{name}</h2>
        <span className="text-muted-foreground tabular-nums">
          {rows.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2" ref={scrollRef}>
        {rows.length === 0 ? (
          <p className="text-muted-foreground px-1 py-6 text-center text-xs">
            Empty
          </p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              if (!row) {
                return null;
              }
              return (
                <div
                  className="absolute top-0 right-0 left-0 pb-2"
                  data-index={item.index}
                  key={item.key}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  <ShelfBoardCard
                    disabled={pendingSourceIds.has(row.id)}
                    onActivate={onRowClick}
                    row={row}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});

export function ShelfBoard({
  rows,
  currentMemberId,
  pendingSourceIds,
  onRowClick,
  onUpdateOpportunity,
}: GeoShelfBoardProps) {
  const grouped = useMemo(() => groupRowsByBoardColumn(rows), [rows]);
  const rowById = useMemo(
    () => new Map(rows.map((row) => [row.id, row])),
    [rows]
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, BOARD_SENSORS.mouse),
    useSensor(TouchSensor, BOARD_SENSORS.touch),
    useSensor(KeyboardSensor)
  );
  const activeRow = activeId ? (rowById.get(activeId) ?? null) : null;

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-48 items-center justify-center rounded-xl border border-dashed px-4 text-sm">
        {GEO_SHELF_NO_MATCHES_MESSAGE}
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const target = columnFromDropId(event.over?.id);
    if (!target || target === UNTRACKED_COLUMN) {
      return;
    }
    const row = rowById.get(String(event.active.id));
    if (!row || row.opportunity?.status === target) {
      return;
    }
    onUpdateOpportunity(row.id, {
      status: target,
      ...(row.opportunity ? {} : { assigneeMemberId: currentMemberId }),
    });
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div
        className="flex gap-3 overflow-x-auto overflow-y-hidden"
        style={{ height: GEO_SHELF_BOARD_HEIGHT }}
      >
        {GEO_SHELF_BOARD_COLUMNS.map((column) => {
          const columnId = column.id as GeoShelfBoardColumnId;
          return (
            <ShelfBoardColumn
              columnId={columnId}
              key={columnId}
              name={column.name}
              onRowClick={onRowClick}
              pendingSourceIds={pendingSourceIds}
              rows={grouped[columnId]}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeRow ? (
          <div
            className="bg-background rounded-lg border p-3 shadow-md"
            style={{ width: GEO_SHELF_BOARD_COLUMN_WIDTH - 16 }}
          >
            <ShelfBoardCardBody row={activeRow} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
