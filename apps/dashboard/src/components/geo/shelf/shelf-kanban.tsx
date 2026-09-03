"use client";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@notra/ui/components/kibo-ui/kanban";
import { Badge } from "@notra/ui/components/ui/badge";
import { useState } from "react";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { ShelfMemberAvatar } from "@/components/geo/shelf/shelf-member-avatar";
import { ShelfPlacementBadge } from "@/components/geo/shelf/shelf-placement-badge";
import {
  GEO_SHELF_KANBAN_COLUMNS,
  GEO_SHELF_KANBAN_NO_TICKET_COLUMN,
  GEO_SHELF_OPPORTUNITY_STATUSES,
  GEO_SHELF_PRIORITY_LABELS,
} from "@/constants/geo-shelf";
import { cn } from "@/lib/utils";
import type {
  GeoShelfKanbanItem,
  GeoShelfKanbanProps,
  GeoShelfOpportunityStatus,
  GeoShelfRow,
} from "@/types/geo-shelf";
import { formatShelfDate, shelfKanbanColumnFor } from "@/utils/geo-shelf";

const DRAG_ACTIVATION_DISTANCE = 6;

function toItems(rows: GeoShelfRow[]): GeoShelfKanbanItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.title ?? row.domain,
    column: shelfKanbanColumnFor(row),
    row,
  }));
}

function itemsSignature(items: GeoShelfKanbanItem[]): string {
  return items.map((item) => `${item.id}:${item.column}`).join("|");
}

function toStatus(column: string): GeoShelfOpportunityStatus | null {
  return (
    GEO_SHELF_OPPORTUNITY_STATUSES.find((status) => status === column) ?? null
  );
}

function cardMeta(row: GeoShelfRow): string {
  if (row.opportunity?.dueAt) {
    return `Due ${formatShelfDate(row.opportunity.dueAt)}`;
  }
  if (row.citations.windowCount > 0) {
    return `${row.citations.windowCount} cites`;
  }
  return "";
}

function ShelfKanbanCardBody({
  row,
  pending,
  onOpen,
}: {
  row: GeoShelfRow;
  pending: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full cursor-[inherit] flex-col gap-2 text-left",
        pending && "opacity-60"
      )}
      onClick={onOpen}
      type="button"
    >
      <span className="flex min-w-0 items-start gap-2">
        <CompetitorLogo
          className="mt-0.5 size-5 shrink-0 rounded-md"
          domain={row.domain}
          name={row.domain}
        />
        <span className="flex min-w-0 flex-col">
          <span className="line-clamp-2 text-sm font-medium">
            {row.title ?? row.url}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {row.domain}
          </span>
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        <ShelfPlacementBadge
          evidence={row.ownPlacement?.evidence}
          status={row.ownPlacement?.status ?? null}
        />
        {row.presentCompetitors.length > 0 ? (
          <Badge className="rounded-sm text-[0.6875rem]" variant="secondary">
            {row.presentCompetitors.length} competitor
            {row.presentCompetitors.length === 1 ? "" : "s"} on it
          </Badge>
        ) : null}
        {row.opportunity?.priority ? (
          <Badge className="rounded-sm text-[0.6875rem]" variant="outline">
            {GEO_SHELF_PRIORITY_LABELS[row.opportunity.priority]}
          </Badge>
        ) : null}
      </span>
      <span className="flex items-center justify-between gap-2">
        <ShelfMemberAvatar
          className="min-w-0 text-xs"
          fallbackLabel={row.opportunity ? "Unassigned" : "No ticket"}
          member={row.assignee}
        />
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {cardMeta(row)}
        </span>
      </span>
    </button>
  );
}

export function ShelfKanban({
  rows,
  currentMemberId,
  pendingSourceIds,
  onOpenRow,
  onUpdateOpportunity,
}: GeoShelfKanbanProps) {
  const derived = toItems(rows);
  const derivedSignature = itemsSignature(derived);
  const [items, setItems] = useState(derived);
  const [seenSignature, setSeenSignature] = useState(derivedSignature);

  if (seenSignature !== derivedSignature) {
    setSeenSignature(derivedSignature);
    setItems(derived);
  }

  const [dragging, setDragging] = useState(false);

  const startDragging = () => {
    setDragging(true);
    document.body.style.cursor = "grabbing";
  };

  const stopDragging = () => {
    setDragging(false);
    document.body.style.cursor = "";
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    stopDragging();
    const activeId = String(event.active.id);
    const moved = items.find((item) => item.id === activeId);
    const original = derived.find((item) => item.id === activeId);
    if (!(moved && original) || moved.column === original.column) {
      return;
    }
    if (moved.column === GEO_SHELF_KANBAN_NO_TICKET_COLUMN) {
      setItems(derived);
      return;
    }
    const status = toStatus(moved.column);
    if (!status) {
      setItems(derived);
      return;
    }
    const hadTicket = original.row.opportunity !== null;
    onUpdateOpportunity(activeId, {
      status,
      ...(hadTicket ? {} : { assigneeMemberId: currentMemberId }),
    });
  };

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.column, (counts.get(item.column) ?? 0) + 1);
  }

  return (
    <div
      className={cn(
        "-m-1 overflow-x-auto p-1 pb-3",
        dragging && "cursor-grabbing **:cursor-grabbing"
      )}
    >
      <KanbanProvider
        className="min-w-[72rem]"
        columns={GEO_SHELF_KANBAN_COLUMNS}
        data={items}
        onDataChange={setItems}
        onDragCancel={stopDragging}
        onDragEnd={handleDragEnd}
        onDragStart={startDragging}
        sensors={sensors}
      >
        {(column) => (
          <KanbanBoard
            className="bg-muted border-border min-h-[32rem] divide-y-0 rounded-2xl shadow-none"
            id={column.id}
            key={column.id}
          >
            <KanbanHeader className="text-muted-foreground flex h-9 items-center justify-between px-2 text-xs font-medium">
              <span>{column.name}</span>
              <span className="text-muted-foreground font-normal tabular-nums">
                {counts.get(column.id) ?? 0}
              </span>
            </KanbanHeader>
            <KanbanCards<GeoShelfKanbanItem>
              className="bg-background border-border min-h-full rounded-t-xl border-t p-2"
              id={column.id}
            >
              {(item) => (
                <KanbanCard<GeoShelfKanbanItem>
                  className="bg-card border-border rounded-xl border shadow-none"
                  column={item.column}
                  id={item.id}
                  key={item.id}
                  name={item.name}
                  row={item.row}
                >
                  <ShelfKanbanCardBody
                    onOpen={() => onOpenRow(item.row)}
                    pending={pendingSourceIds.has(item.id)}
                    row={item.row}
                  />
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
