"use client";
// beui.dev/components/motion/table

import { useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

import { useTableViewport } from "@/lib/hooks/use-table-viewport";
import { cn } from "@/lib/utils";

import { RowHandle } from "./row-handle";
import { TableBody } from "./table-body";
import { TableColumnGroup } from "./table-column-group";
import { TableHeader } from "./table-header";
import { TableFooterSurface, TableHeaderSurface } from "./table-surfaces";
import type { HeaderCellRefs, TableProps } from "./types";
import { useColumnReorder } from "./use-column-reorder";
import { useColumnResize } from "./use-column-resize";
import { useColumnSort } from "./use-column-sort";
import { useRowSelection } from "./use-row-selection";
import { DEFAULT_MIN_COLUMN_WIDTH, pinRowsFirst } from "./utils";

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
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
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
  rowSizing = "fixed",
  height = 440,
  minHeight,
  overscan = 10,
  onEndReached,
  loading = false,
  skeletonRows = 3,
  emptyState = "No data",
  onRowClick,
  isRowClickable,
  renderRowContextMenu,
  onRowPointerEnter,
  isRowPinned,
  toolbar,
  footer,
  page = 1,
  pageSize,
  flushTop = false,
  flushBottom = false,
  overlapTop = false,
  className,
}: TableProps<T>) {
  "use no memo";
  const reduce = useReducedMotion();
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
  const displayRows = useMemo(
    () => pinRowsFirst(sortedRows, isRowPinned),
    [sortedRows, isRowPinned]
  );
  const pagedRows = useMemo(() => {
    if (pageSize == null) {
      return displayRows;
    }
    const start = Math.max(0, page - 1) * pageSize;
    return displayRows.slice(start, start + pageSize);
  }, [displayRows, page, pageSize]);

  const viewport = useTableViewport({
    rows: pagedRows,
    rowHeight,
    rowSizing,
    height,
    minHeight,
    overscan,
    loading,
    onEndReached,
  });
  const columnGroup = (
    <TableColumnGroup
      columns={orderedColumns}
      widths={widths}
      selectable={selectable}
      reorderable={reorderable}
      minColumnWidth={minColumnWidth}
    />
  );
  const isEmpty = pagedRows.length === 0 && !loading;
  const hasRowMenu = !!(onInsertRow || onDeleteRow);
  const hasColumnMenu = !!(onInsertColumn || onDeleteColumn);
  // Shrink-wrap only after every column has an explicit resized width.
  const sized =
    orderedColumns.length > 0 &&
    orderedColumns.every((column) => widths[column.key] != null);
  const tableClassName = cn(
    "border-collapse",
    sized ? "w-max min-w-full" : "w-full"
  );

  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  // Let the pointer cross the gap to the portal handle before deactivating.
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
  const columnMenuProps = hasColumnMenu
    ? {
        activeColumn,
        onColumnActivate: activateColumn,
        onColumnDeactivate: deactivateColumn,
      }
    : { activeColumn: null };

  return (
    <div
      aria-busy={loading}
      className={cn("w-full min-w-0 text-sm", className)}
    >
      {/* Overlap hides the header's side border in the body radius. */}
      <TableHeaderSurface
        toolbar={toolbar}
        flushTop={flushTop}
        overlapTop={overlapTop}
      >
        <div
          className="overflow-hidden"
          ref={viewport.headerScrollRef}
          style={viewport.headerStyle}
        >
          <table className={tableClassName} style={{ tableLayout: "fixed" }}>
            {columnGroup}
            <TableHeader
              {...columnMenuProps}
              allSelected={allSelected}
              columns={orderedColumns}
              dragKey={dragKey}
              dropIndex={dropIndex}
              minColumnWidth={minColumnWidth}
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
      </TableHeaderSurface>
      <div
        className={cn(
          "scrollbar-floating border-border bg-background relative -mt-5 box-content rounded-2xl border outline-none",
          isEmpty ? "overflow-hidden" : viewport.overflowClass,
          flushBottom && !footer && "rounded-b-none"
        )}
        onScroll={viewport.handleScroll}
        ref={viewport.scrollRef}
        style={viewport.bodyStyle}
      >
        <table className={tableClassName} style={{ tableLayout: "fixed" }}>
          {columnGroup}
          <TableBody
            columns={orderedColumns}
            renderedRows={viewport.renderedRows}
            rowCount={pagedRows.length}
            rowHeight={rowHeight}
            rowSizing={rowSizing}
            bodyHeight={viewport.bodyHeight}
            loading={loading}
            skeletonRows={skeletonRows}
            emptyState={emptyState}
            selectable={selectable}
            selected={selected}
            scrolls={viewport.scrolls}
            paddingTop={viewport.paddingTop}
            paddingBottom={viewport.paddingBottom}
            hasRowMenu={hasRowMenu}
            onActivate={activateRow}
            onDeactivate={deactivateRow}
            onToggleRow={toggleRow}
            onCellEdit={onCellEdit}
            onRowClick={onRowClick}
            isRowClickable={isRowClickable}
            onRowPointerEnter={onRowPointerEnter}
            renderRowContextMenu={renderRowContextMenu}
            rowRefs={rowRefs}
          />
        </table>
      </div>
      <TableFooterSurface footer={footer} flushBottom={flushBottom} />
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
