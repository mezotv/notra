"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanDragEndEvent,
} from "@notra/ui/components/kibo-ui/kanban";
import { useState } from "react";

import { ShelfPlacementBadge } from "@/components/geo/shelf/shelf-placement-badge";
import { ShelfTicketBadge } from "@/components/geo/shelf/shelf-ticket-badge";
import { GEO_SHELF_BOARD_COLUMNS } from "@/constants/geo-shelf";
import type {
  GeoShelfBoardColumnId,
  GeoShelfBoardItem,
  GeoShelfBoardProps,
} from "@/types/geo-shelf";

const BOARD_COLUMNS = GEO_SHELF_BOARD_COLUMNS.map((column) => ({ ...column }));

export function ShelfBoard({
  rows,
  currentMemberId,
  pendingSourceIds,
  onRowClick,
  onUpdateOpportunity,
}: GeoShelfBoardProps) {
  const rowItems: GeoShelfBoardItem[] = rows.map((source) => ({
    id: source.id,
    name: source.title ?? source.domain,
    column: source.opportunity?.status ?? "untracked",
    source,
  }));
  const [dragItems, setDragItems] = useState<GeoShelfBoardItem[] | null>(null);
  const items = dragItems ?? rowItems;

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-48 items-center justify-center rounded-xl border border-dashed px-4 text-sm">
        No shelves match these filters
      </div>
    );
  }

  const handleDragEnd = (event: KanbanDragEndEvent) => {
    setDragItems(null);
    const target = event.targetColumnId as GeoShelfBoardColumnId | null;
    if (!target || target === "untracked") {
      return;
    }
    const item = items.find((candidate) => candidate.id === event.active.id);
    if (item?.source.opportunity?.status === target) {
      return;
    }
    onUpdateOpportunity(String(event.active.id), {
      status: target,
      ...(item?.source.opportunity
        ? {}
        : { assigneeMemberId: currentMemberId }),
    });
  };

  return (
    <div className="overflow-x-auto pb-2">
      <KanbanProvider
        className="min-h-[32rem] min-w-max auto-cols-[17rem]"
        columns={BOARD_COLUMNS}
        data={items}
        dropDisabledColumnIds={["untracked"]}
        onDataChange={setDragItems}
        onDragCancel={() => setDragItems(null)}
        onDragEnd={handleDragEnd}
        onDragStart={() => setDragItems(rowItems)}
      >
        {(column) => {
          const count = items.filter(
            (item) => item.column === column.id
          ).length;
          return (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader className="flex items-center justify-between">
                <span>{column.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {count}
                </span>
              </KanbanHeader>
              <KanbanCards<GeoShelfBoardItem> id={column.id}>
                {(item) => (
                  <KanbanCard
                    column={item.column}
                    disabled={pendingSourceIds.has(item.id)}
                    id={item.id}
                    key={item.id}
                    name={item.name}
                    onActivate={() => onRowClick(item.source)}
                  >
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.source.domain}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.source.opportunity ? (
                          <ShelfTicketBadge
                            status={item.source.opportunity.status}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No ticket
                          </span>
                        )}
                        <ShelfPlacementBadge
                          evidence={item.source.ownPlacement?.evidence}
                          status={item.source.ownPlacement?.status ?? null}
                        />
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">
                          {item.source.assignee?.name ??
                            item.source.assignee?.email ??
                            "Unassigned"}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {item.source.citations.windowCount} cited
                        </span>
                      </div>
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          );
        }}
      </KanbanProvider>
    </div>
  );
}
