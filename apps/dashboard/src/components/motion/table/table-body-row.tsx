"use client";

import { Checkbox } from "@/components/motion/checkbox";
import { cn } from "@/lib/utils";
import { EditableCell } from "./editable-cell";
import type { TableColumn, TableRow } from "./types";
import { alignText, readCell, TABLE_CELL_INNER_CLASS } from "./utils";

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="checkbox"], [role="menuitem"], [role="button"], [contenteditable="true"]';

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
  );
}

export function TableBodyRow<T>({
  entry,
  index,
  rowHeight,
  selectable,
  isSelected,
  sticky = false,
  columns,
  onRowClick,
  onRowPointerEnter,
  hasRowMenu,
  onActivate,
  onDeactivate,
  onToggleRow,
  onCellEdit,
  rowRef,
}: {
  entry: TableRow<T>;
  index: number;
  rowHeight: number;
  selectable: boolean;
  isSelected: boolean;
  sticky?: boolean;
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  onRowPointerEnter?: (row: T) => void;
  hasRowMenu: boolean;
  onActivate?: (id: string, index: number) => void;
  onDeactivate?: () => void;
  onToggleRow: (id: string) => void;
  onCellEdit?: (rowId: string, columnKey: string, value: string) => void;
  rowRef: (el: HTMLTableRowElement | null) => void;
}) {
  const stickyCell = sticky
    ? "sticky top-0 z-20 bg-background shadow-[inset_0_-1px_0_0_var(--color-border)] group-hover:bg-muted/50 group-data-[selected=true]:bg-primary/5"
    : undefined;

  return (
    <tr
      className={cn(
        "group transition-colors",
        "data-[selected=true]:bg-primary/5",
        "hover:bg-muted/50",
        onRowClick && "cursor-pointer",
        sticky && "sticky top-0 z-20 bg-background"
      )}
      data-selected={isSelected}
      onClick={
        onRowClick
          ? (event) => {
              if (isInteractiveTarget(event.target)) {
                return;
              }
              onRowClick(entry.row);
            }
          : undefined
      }
      onKeyDown={
        onRowClick
          ? (event) => {
              if (event.target !== event.currentTarget) {
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRowClick(entry.row);
              }
            }
          : undefined
      }
      onPointerEnter={
        hasRowMenu || onRowPointerEnter
          ? () => {
              if (hasRowMenu) {
                onActivate?.(entry.id, index);
              }
              onRowPointerEnter?.(entry.row);
            }
          : undefined
      }
      onPointerLeave={hasRowMenu ? onDeactivate : undefined}
      ref={rowRef}
      style={{ height: rowHeight }}
      tabIndex={onRowClick ? 0 : undefined}
    >
      {selectable ? (
        <td className={cn("border-border/60 border-b text-center", stickyCell)}>
          <div className="flex items-center justify-center">
            <Checkbox
              aria-label={`Select row ${index + 1}`}
              checked={isSelected}
              className="size-6"
              onCheckedChange={() => onToggleRow(entry.id)}
            />
          </div>
        </td>
      ) : null}
      {columns.map((column) => (
        <td
          className={cn(
            "max-w-0 overflow-hidden border-border/60 border-b px-4 text-foreground",
            alignText(column.align),
            stickyCell
          )}
          key={column.key}
        >
          <div className={cn(TABLE_CELL_INNER_CLASS, alignText(column.align))}>
            {!column.cell && column.editable ? (
              <EditableCell
                label={`${column.key} for row ${index + 1}`}
                onChange={(next) => onCellEdit?.(entry.id, column.key, next)}
                value={String(readCell(entry.row, column) ?? "")}
              />
            ) : (
              readCell(entry.row, column)
            )}
          </div>
        </td>
      ))}
      <td aria-hidden className={cn("border-border/60 border-b", stickyCell)} />
    </tr>
  );
}
