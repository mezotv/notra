"use client";

/**
 * Vendored from Kibo UI.
 * Upstream: https://raw.githubusercontent.com/haydenbleasel/kibo/main/packages/kanban/index.tsx
 *
 * Divergences from upstream (keep in sync when re-syncing):
 *
 * Structural / cosmetic
 *  1. Imports resolve through `@notra/ui/*` instead of the upstream `@/*` alias.
 *  2. `KanbanItemProps`, `KanbanColumnProps` and `KanbanContextProps` are exported.
 *  3. `ScrollArea`/`ScrollBar` around `KanbanCards` removed: columns run flush and
 *     the whole board scrolls horizontally in the consumer instead.
 *  4. Grab/grabbing cursors live on the sortable wrapper (the card inherits them)
 *     rather than on the `Card` itself.
 *  5. `CSS.Translate.toString` instead of `CSS.Transform.toString` so cards are not
 *     scaled while dragging.
 *  6. `DragOverlay` uses `dropAnimation={null}` (the overlay is a portal clone, the
 *     upstream drop animation flashes against the re-rendered board).
 *  7. Context value is memoized and `activeCardId` lives in its own context so cards
 *     do not re-render for every board data change.
 *
 * Behaviour
 *  8. Immutable updates + index guards: upstream mutates `data[activeIndex].column`
 *     in place and calls `arrayMove` with `-1` indexes when the drop target is a
 *     column rather than a card.
 *  9. No `arrayMove` anywhere. A drop only changes column membership; ordering stays
 *     owned by whatever feeds `data`, so it cannot drift from the source of truth.
 * 10. `dropDisabledColumnIds`: listed columns render as a rejected drop target,
 *     never receive a card on drag over or drag end (cards can still be dragged
 *     *out* of them).
 * 11. `data` is snapshotted on drag start and restored in a provider level
 *     `handleDragCancel`, so `Escape` reverts cross-column drag-over moves.
 * 12. `onDragEnd` receives a `KanbanDragEndEvent` carrying the resolved, validated
 *     `targetColumnId` (null when the drop was rejected and reverted), so consumers
 *     never have to diff state to find out what happened.
 * 13. Upstream's `columns[0]?.id` fallback for an unresolvable drop target is gone:
 *     an unknown target is a rejected drop, not a drop into the first column.
 * 14. `KanbanCard` gained `disabled` (locks dragging while a row mutation is in
 *     flight) and `onActivate` (click / Enter opens the card). The wrapper is the
 *     single interactive element, so nothing nests inside dnd-kit's `role="button"`.
 * 15. `touch-none` removed from the card wrapper (upstream has none either) in
 *     favour of `touch-manipulation`; the touch sensor uses a delay + tolerance
 *     so touch scrolling still wins.
 * 16. Sensors: activation constraints, `sortableKeyboardCoordinates`, and keyboard
 *     codes that reserve `Enter` for activation and leave `Space` to lift a card.
 * 17. Announcements resolve `over.id` against both cards and columns, speak the
 *     column *name*, and announce rejected drop targets.
 * 18. Cards are never droppables and collision detection is column based
 *     (`pointerWithin`, then `rectIntersection`, then `closestCenter`), so a drop
 *     lands in the column under the pointer even when it is tall or empty.
 */

import type {
  Announcements,
  DndContextProps,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";

import { Card } from "@notra/ui/components/ui/card";
import { cn } from "@notra/ui/lib/utils";

const t = tunnel();

const POINTER_ACTIVATION_DISTANCE = 6;
const TOUCH_ACTIVATION_DELAY_MS = 150;
const TOUCH_ACTIVATION_TOLERANCE = 8;

/**
 * `Enter` is deliberately not a start/end code: it stays available for activating
 * a card. `Space` lifts and drops, which is what dnd-kit announces by default.
 */
const KEYBOARD_CODES = {
  start: ["Space"],
  cancel: ["Escape"],
  end: ["Space", "Tab"],
};

const EMPTY_DROP_DISABLED_COLUMN_IDS: ReadonlySet<string> = new Set<string>();

/**
 * Columns are the only droppables, so a drop resolves to whichever column the
 * pointer is inside. Keyboard drags have no pointer and fall back to the
 * overlay rectangle, then to the nearest column centre. `closestCenter` alone
 * mis-targets tall or empty columns because their centre sits far below the
 * pointer while a neighbouring column's cards are closer.
 */
const columnCollision: CollisionDetection = (args) => {
  const withinPointer = pointerWithin(args);
  if (withinPointer.length > 0) {
    return withinPointer;
  }
  const intersecting = rectIntersection(args);
  if (intersecting.length > 0) {
    return intersecting;
  }
  return closestCenter(args);
};

export type { DragEndEvent } from "@dnd-kit/core";

export type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

export type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

/** A drag end event enriched with the destination the provider actually accepted. */
export type KanbanDragEndEvent = DragEndEvent & {
  /** Resolved destination column, or `null` when the drop was rejected and reverted. */
  targetColumnId: string | null;
};

export type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  dropDisabledColumnIds: ReadonlySet<string>;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  dropDisabledColumnIds: EMPTY_DROP_DISABLED_COLUMN_IDS,
});

const KanbanActiveCardContext = createContext<string | null>(null);

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { dropDisabledColumnIds } = useContext(KanbanContext);
  const dropDisabled = dropDisabledColumnIds.has(id);
  const { isOver, setNodeRef } = useDroppable({ id });
  const rejectsDrop = isOver && dropDisabled;

  return (
    <div
      className={cn(
        "bg-secondary flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border text-xs shadow-sm ring-2 transition-all",
        isOver && !dropDisabled && "ring-primary",
        rejectsDrop && "ring-muted-foreground/40",
        !isOver && "ring-transparent",
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
  /** Locks dragging, e.g. while the row this card represents is being saved. */
  disabled?: boolean;
  /** Called on click or `Enter` when the card is not being dragged. */
  onActivate?: () => void;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
  disabled = false,
  onActivate,
}: KanbanCardProps<T>) => {
  const activeCardId = useContext(KanbanActiveCardContext);
  // Cards are draggable only: order inside a column is derived from `data`, so
  // the column is the sole drop target and collisions never land on a card.
  const sortableDisabled = useMemo(
    () => ({ draggable: disabled, droppable: true }),
    [disabled]
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({ id, disabled: sortableDisabled });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  // dnd-kit swallows the `click` that follows a pointer drag (it registers a
  // capture phase document listener once the activation constraint is met), so a
  // click only reaches us when no drag happened. The `isDragging` guard covers
  // keyboard drags, where no pointer event is involved at all.
  const activate = () => {
    if (isDragging) {
      return;
    }
    onActivate?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    activate();
  };

  return (
    <>
      {/* react-doctor-disable-next-line react-doctor/no-static-element-interactions -- dnd-kit attributes provide button semantics */}
      <div
        className={cn(
          // `touch-manipulation` rather than `touch-none`: the touch sensor
          // activates on a delay, so vertical scrolling by dragging a card has
          // to keep working.
          "group/kanban-card touch-manipulation select-none outline-none",
          disabled
            ? "cursor-default"
            : "cursor-grab active:cursor-grabbing data-[dragging=true]:cursor-grabbing"
        )}
        data-dragging={isDragging}
        style={style}
        {...listeners}
        {...attributes}
        onClick={activate}
        onKeyDown={handleKeyDown}
        ref={setNodeRef}
      >
        <Card
          className={cn(
            "group-focus-visible/kanban-card:ring-ring cursor-[inherit] gap-4 rounded-md p-3 shadow-sm group-focus-visible/kanban-card:ring-2",
            isDragging && "pointer-events-none opacity-30",
            className
          )}
        >
          {children ?? <p className="m-0 text-sm font-medium">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "ring-primary cursor-grabbing gap-4 rounded-md p-3 shadow-sm ring-2",
              className
            )}
          >
            {children ?? <p className="m-0 text-sm font-medium">{name}</p>}
          </Card>
        </t.In>
      )}
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SortableContext items={items}>
        <div
          className={cn("flex flex-grow flex-col gap-2 p-2", className)}
          {...props}
        >
          {filteredData.map(children)}
        </div>
      </SortableContext>
    </div>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn("m-0 p-2 text-sm font-semibold", className)} {...props} />
);

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<
  DndContextProps,
  "children" | "onDragCancel" | "onDragEnd" | "onDragOver" | "onDragStart"
> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  /** Columns that render as targets but never accept a card. */
  dropDisabledColumnIds?: readonly string[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: KanbanDragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragCancel,
  className,
  columns,
  data,
  dropDisabledColumnIds,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const snapshotRef = useRef<T[] | null>(null);

  const dropDisabled = useMemo(
    () =>
      dropDisabledColumnIds
        ? new Set(dropDisabledColumnIds)
        : EMPTY_DROP_DISABLED_COLUMN_IDS,
    [dropDisabledColumnIds]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY_MS,
        tolerance: TOUCH_ACTIVATION_TOLERANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: KEYBOARD_CODES,
    })
  );

  /** Resolves a droppable id to a column id, whether it is a column or a card. */
  const columnIdFor = (overId: UniqueIdentifier | undefined): string | null => {
    if (overId === undefined) {
      return null;
    }
    const id = String(overId);
    const overItem = data.find((item) => item.id === id);
    if (overItem) {
      return overItem.column;
    }
    return columns.find((entry) => entry.id === id)?.id ?? null;
  };

  const columnNameFor = (columnId: string | null): string =>
    columns.find((entry) => entry.id === columnId)?.name ?? "unknown";

  const cardNameFor = (cardId: UniqueIdentifier): string =>
    data.find((item) => item.id === cardId)?.name ?? "card";

  const moveTo = (cardId: string, columnId: string) => {
    onDataChange?.(
      data.map((item) =>
        item.id === cardId ? { ...item, column: columnId } : item
      )
    );
  };

  const takeSnapshot = () => {
    const snapshot = snapshotRef.current;
    snapshotRef.current = null;
    return snapshot;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = String(event.active.id);
    if (data.some((item) => item.id === cardId)) {
      setActiveCardId(cardId);
      snapshotRef.current = data;
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const activeItem = data.find((item) => item.id === active.id);
    const overColumn = over ? columnIdFor(over.id) : null;

    if (
      activeItem &&
      overColumn &&
      overColumn !== activeItem.column &&
      !dropDisabled.has(overColumn)
    ) {
      moveTo(activeItem.id, overColumn);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    const snapshot = takeSnapshot();

    const cardId = String(event.active.id);
    const overColumn = columnIdFor(event.over?.id);
    const accepted = overColumn !== null && !dropDisabled.has(overColumn);

    if (accepted) {
      const activeItem = data.find((item) => item.id === cardId);
      if (activeItem && activeItem.column !== overColumn) {
        moveTo(cardId, overColumn);
      }
    } else if (snapshot) {
      onDataChange?.(snapshot);
    }

    onDragEnd?.({ ...event, targetColumnId: accepted ? overColumn : null });
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveCardId(null);
    const snapshot = takeSnapshot();
    if (snapshot) {
      onDataChange?.(snapshot);
    }
    onDragCancel?.(event);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = data.find((entry) => entry.id === active.id);
      return `Picked up the card "${cardNameFor(active.id)}" from the "${columnNameFor(item?.column ?? null)}" column.`;
    },
    onDragOver({ active, over }) {
      const name = cardNameFor(active.id);
      const overColumn = columnIdFor(over?.id);
      if (overColumn === null) {
        return `The card "${name}" is not over a column.`;
      }
      if (dropDisabled.has(overColumn)) {
        return `The card "${name}" cannot be dropped into the "${columnNameFor(overColumn)}" column.`;
      }
      return `Dragged the card "${name}" over the "${columnNameFor(overColumn)}" column.`;
    },
    onDragEnd({ active, over }) {
      const name = cardNameFor(active.id);
      const overColumn = columnIdFor(over?.id);
      if (overColumn === null) {
        return `The card "${name}" was dropped outside of the board and returned to its column.`;
      }
      if (dropDisabled.has(overColumn)) {
        return `The card "${name}" cannot be dropped into the "${columnNameFor(overColumn)}" column and returned to its column.`;
      }
      return `Dropped the card "${name}" into the "${columnNameFor(overColumn)}" column.`;
    },
    onDragCancel({ active }) {
      return `Cancelled dragging the card "${cardNameFor(active.id)}". It returned to its column.`;
    },
  };

  const contextValue = useMemo(
    () => ({ columns, data, dropDisabledColumnIds: dropDisabled }),
    [columns, data, dropDisabled]
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      <KanbanActiveCardContext.Provider value={activeCardId}>
        <DndContext
          accessibility={{ announcements }}
          collisionDetection={columnCollision}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          sensors={sensors}
          {...props}
        >
          <div
            className={cn(
              "grid size-full auto-cols-fr grid-flow-col gap-4",
              className
            )}
          >
            {columns.map((column) => children(column))}
          </div>
          {typeof window !== "undefined" &&
            createPortal(
              <DragOverlay dropAnimation={null}>
                <t.Out />
              </DragOverlay>,
              document.body
            )}
        </DndContext>
      </KanbanActiveCardContext.Provider>
    </KanbanContext.Provider>
  );
};
