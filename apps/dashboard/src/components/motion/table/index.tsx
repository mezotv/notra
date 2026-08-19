"use client";
// beui.dev/components/motion/table

import { useVirtualizer } from "@tanstack/react-virtual";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/motion/checkbox";
import { cn } from "@/lib/utils";
import { EditableCell } from "./editable-cell";
import { RowHandle } from "./row-handle";
import { SkeletonRows } from "./skeleton-rows";
import { TableHeader } from "./table-header";
import type { HeaderCellRefs, TableProps } from "./types";
import { useColumnReorder } from "./use-column-reorder";
import { useColumnResize } from "./use-column-resize";
import { useColumnSort } from "./use-column-sort";
import { useRowSelection } from "./use-row-selection";
import {
  alignText,
  CHECKBOX_WIDTH,
  readCell,
  resolveColumnWidths,
} from "./utils";

export type { SortState, TableColumn, TableProps } from "./types";

export function Table<T>({
  data,
  columns,
  getRowId,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds,
  onSelectionChange,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  resizable = false,
  minColumnWidth = 64,
  onColumnResize,
  reorderable = false,
  onColumnOrderChange,
  onCellEdit,
  onColumnRename,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  rowHeight = 48,
  height = 440,
  overscan = 10,
  onEndReached,
  loading = false,
  skeletonRows = 3,
  emptyState = "No data",
  onRowClick,
  className,
}: TableProps<T>) {
  "use no memo";
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const thRefs: HeaderCellRefs = useRef<
    Record<string, HTMLTableCellElement | null>
  >({});

  const rows = useMemo(
    () =>
      data.map((row, index) => ({
        row,
        id: getRowId ? getRowId(row, index) : String(index),
      })),
    [data, getRowId]
  );

  const {
    orderedColumns,
    dragKey,
    dropIndex,
    startReorder,
    moveReorder,
    endReorder,
  } = useColumnReorder({ columns, thRefs, onColumnOrderChange });

  const { sort, sortedRows, toggleSort } = useColumnSort({
    rows,
    columns,
    sort: sortProp,
    defaultSort,
    onSortChange,
  });

  const { widths, startResize, moveResize, endResize } = useColumnResize({
    orderedColumns,
    thRefs,
    minColumnWidth,
    onColumnResize,
  });

  const { selected, allSelected, someSelected, toggleAll, toggleRow } =
    useRowSelection({
      sortedRows,
      selectedRowIds,
      defaultSelectedRowIds,
      onSelectionChange,
    });

  const virtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const lastVirtualItem = virtualItems.at(-1);
  const paddingBottom = lastVirtualItem ? totalSize - lastVirtualItem.end : 0;

  const resolvedWidths = useMemo(
    () => resolveColumnWidths(orderedColumns),
    [orderedColumns]
  );

  const columnGroup = (
    <colgroup>
      {selectable ? <col style={{ width: CHECKBOX_WIDTH }} /> : null}
      {orderedColumns.map((column, index) => {
        const override = widths[column.key];
        const width = override ? `${override}px` : resolvedWidths[index];
        return <col key={column.key} style={width ? { width } : undefined} />;
      })}
      <col />
    </colgroup>
  );
  const bodyHeight = Math.max(rowHeight, height - rowHeight);
  const contentHeight = Math.max(
    rowHeight,
    Math.min(bodyHeight, sortedRows.length * rowHeight)
  );
  const scrolls = sortedRows.length * rowHeight > bodyHeight;

  const hasRowMenu = !!(onInsertRow || onDeleteRow);
  const hasColumnMenu = !!(onInsertColumn || onDeleteColumn);
  // Only shrink-wrap (w-max) once every column has an explicit resized width;
  // otherwise stay fill-width so a flexible column can't size to cell content.
  const sized =
    orderedColumns.length > 0 &&
    orderedColumns.every((c) => widths[c.key] != null);

  // Infinite scroll: fire onEndReached once per near-bottom dwell, paused while
  // loading; the guard resets when the load completes.
  const endReachedRef = useRef(false);
  useEffect(() => {
    if (!loading) {
      endReachedRef.current = false;
    }
  }, [loading]);
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = el.scrollLeft;
    }
    if (!onEndReached || loading || endReachedRef.current) {
      return;
    }
    if (el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 4) {
      endReachedRef.current = true;
      onEndReached();
    }
  }, [onEndReached, loading, rowHeight]);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  // Small delay on leave so the pointer can cross the gap from the header cell
  // to the portal handle without the column deactivating.
  const deactivateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activateColumn = useCallback((key: string) => {
    if (deactivateTimer.current) {
      clearTimeout(deactivateTimer.current);
    }
    deactivateTimer.current = null;
    setActiveColumn(key);
  }, []);
  const deactivateColumn = useCallback(() => {
    if (deactivateTimer.current) {
      clearTimeout(deactivateTimer.current);
    }
    deactivateTimer.current = setTimeout(() => setActiveColumn(null), 100);
  }, []);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [activeRow, setActiveRow] = useState<{
    id: string;
    index: number;
  } | null>(null);
  const rowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activateRow = useCallback((id: string, index: number) => {
    if (rowTimer.current) {
      clearTimeout(rowTimer.current);
    }
    rowTimer.current = null;
    setActiveRow({ id, index });
  }, []);
  const deactivateRow = useCallback(() => {
    if (rowTimer.current) {
      clearTimeout(rowTimer.current);
    }
    rowTimer.current = setTimeout(() => setActiveRow(null), 100);
  }, []);
  const activeRowEl = activeRow
    ? (rowRefs.current[activeRow.id] ?? null)
    : null;
  // Real columns + checkbox; the trailing spacer adds one more in colSpans.
  const leadColumns = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("w-full text-sm", className)}>
      <div
        className="overflow-hidden rounded-t-2xl border border-border border-b-0 bg-muted pb-3"
        ref={headerScrollRef}
        style={scrolls ? { scrollbarGutter: "stable" } : undefined}
      >
        <table
          className={cn(
            "border-collapse",
            sized ? "w-max min-w-full" : "w-full"
          )}
          style={{ tableLayout: "fixed" }}
        >
          {columnGroup}
          <TableHeader
            activeColumn={hasColumnMenu ? activeColumn : null}
            allSelected={allSelected}
            columns={orderedColumns}
            dragKey={dragKey}
            dropIndex={dropIndex}
            onColumnActivate={hasColumnMenu ? activateColumn : undefined}
            onColumnDeactivate={hasColumnMenu ? deactivateColumn : undefined}
            onColumnRename={onColumnRename}
            onDeleteColumn={onDeleteColumn}
            onInsertColumn={onInsertColumn}
            onReorderEnd={endReorder}
            onReorderMove={moveReorder}
            onReorderStart={startReorder}
            onResizeEnd={endResize}
            onResizeMove={moveResize}
            onResizeStart={startResize}
            onToggleAll={toggleAll}
            onToggleSort={toggleSort}
            reduce={!!reduce}
            reorderable={reorderable}
            resizable={resizable}
            rowHeight={rowHeight}
            selectable={selectable}
            someSelected={someSelected}
            sort={sort}
            thRefs={thRefs}
          />
        </table>
      </div>

      <div
        className={cn(
          "-mt-3 scrollbar-floating relative rounded-2xl border border-border bg-background outline-none",
          scrolls ? "overflow-auto" : "overflow-x-auto overflow-y-hidden"
        )}
        onScroll={handleScroll}
        ref={scrollRef}
        style={
          scrolls
            ? { height: bodyHeight, scrollbarGutter: "stable" }
            : { height: sortedRows.length === 0 ? bodyHeight : contentHeight }
        }
      >
        <table
          className={cn(
            "border-collapse",
            sized ? "w-max min-w-full" : "w-full"
          )}
          style={{ tableLayout: "fixed" }}
        >
          {columnGroup}
          <tbody>
            {sortedRows.length === 0 ? (
              loading ? (
                <SkeletonRows
                  columns={orderedColumns}
                  count={Math.max(1, Math.ceil(height / rowHeight))}
                  rowHeight={rowHeight}
                  selectable={selectable}
                />
              ) : (
                <tr>
                  <td className="p-0" colSpan={leadColumns + 1}>
                    <div
                      className="flex items-center justify-center px-6 text-center text-muted-foreground"
                      style={{ height: bodyHeight }}
                    >
                      {emptyState}
                    </div>
                  </td>
                </tr>
              )
            ) : (
              <>
                {paddingTop > 0 ? (
                  <tr aria-hidden style={{ height: paddingTop }}>
                    <td colSpan={leadColumns + 1} />
                  </tr>
                ) : null}
                {virtualItems.map((vItem) => {
                  const entry = sortedRows[vItem.index];
                  if (!entry) {
                    return null;
                  }
                  const isSelected = selected.has(entry.id);
                  return (
                    <tr
                      className={cn(
                        "border-border/60 border-b transition-colors",
                        "data-[selected=true]:bg-primary/5",
                        "hover:bg-muted/50",
                        onRowClick && "cursor-pointer"
                      )}
                      data-selected={isSelected}
                      key={entry.id}
                      onClick={
                        onRowClick ? () => onRowClick(entry.row) : undefined
                      }
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onRowClick(entry.row);
                              }
                            }
                          : undefined
                      }
                      onPointerEnter={
                        hasRowMenu
                          ? () => activateRow(entry.id, vItem.index)
                          : undefined
                      }
                      onPointerLeave={hasRowMenu ? deactivateRow : undefined}
                      ref={(el) => {
                        rowRefs.current[entry.id] = el;
                      }}
                      style={{ height: rowHeight }}
                      tabIndex={onRowClick ? 0 : undefined}
                    >
                      {selectable ? (
                        <td className="text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              aria-label={`Select row ${vItem.index + 1}`}
                              checked={isSelected}
                              className="size-6"
                              onCheckedChange={() => toggleRow(entry.id)}
                            />
                          </div>
                        </td>
                      ) : null}
                      {orderedColumns.map((column) => (
                        <td
                          className={cn(
                            "max-w-0 truncate px-4 text-foreground",
                            "[&>*]:min-w-0 [&>*]:max-w-full",
                            alignText(column.align)
                          )}
                          key={column.key}
                        >
                          {!column.cell && column.editable ? (
                            <EditableCell
                              label={`${column.key} for row ${vItem.index + 1}`}
                              onChange={(next) =>
                                onCellEdit?.(entry.id, column.key, next)
                              }
                              value={String(readCell(entry.row, column) ?? "")}
                            />
                          ) : (
                            readCell(entry.row, column)
                          )}
                        </td>
                      ))}
                      <td aria-hidden />
                    </tr>
                  );
                })}
                {paddingBottom > 0 ? (
                  <tr aria-hidden style={{ height: paddingBottom }}>
                    <td colSpan={leadColumns + 1} />
                  </tr>
                ) : null}
                {loading ? (
                  <SkeletonRows
                    columns={orderedColumns}
                    count={skeletonRows}
                    rowHeight={rowHeight}
                    selectable={selectable}
                  />
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
      {hasRowMenu && activeRow ? (
        <RowHandle
          id={activeRow.id}
          index={activeRow.index}
          onDeleteRow={onDeleteRow}
          onEnter={() => activateRow(activeRow.id, activeRow.index)}
          onInsertRow={onInsertRow}
          onLeave={deactivateRow}
          rowEl={activeRowEl}
        />
      ) : null}
    </div>
  );
}
