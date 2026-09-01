"use client";
// beui.dev/components/motion/table

import { useVirtualizer } from "@tanstack/react-virtual";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { RowHandle } from "./row-handle";
import { SkeletonRows } from "./skeleton-rows";
import { TableBodyRow } from "./table-body-row";
import { TableHeader } from "./table-header";
import type { HeaderCellRefs, TableProps } from "./types";
import { useColumnReorder } from "./use-column-reorder";
import { useColumnResize } from "./use-column-resize";
import { useColumnSort } from "./use-column-sort";
import { useRowSelection } from "./use-row-selection";
import {
  CHECKBOX_WIDTH,
  colWidthStyle,
  DEFAULT_MIN_COLUMN_WIDTH,
  headerMinWidth,
  isFrWidth,
  pinRowsFirst,
  REORDER_HANDLE_PX,
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
  height = 440,
  minHeight,
  overscan = 10,
  onEndReached,
  loading = false,
  skeletonRows = 3,
  emptyState = "No data",
  onRowClick,
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

  const virtualizer = useVirtualizer({
    count: pagedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    initialRect: { height, width: 0 },
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const lastVirtualItem = virtualItems.at(-1);
  const paddingBottom = lastVirtualItem ? totalSize - lastVirtualItem.end : 0;

  const resolvedWidths = useMemo(
    () =>
      resolveColumnWidths(orderedColumns, selectable ? [CHECKBOX_WIDTH] : []),
    [orderedColumns, selectable]
  );
  const hasFlexibleColumn = orderedColumns.some(
    (column) => widths[column.key] == null && isFrWidth(column.width)
  );

  const columnGroup = (
    <colgroup>
      {selectable ? (
        <col style={{ width: CHECKBOX_WIDTH, minWidth: CHECKBOX_WIDTH }} />
      ) : null}
      {orderedColumns.map((column, index) => {
        const override = widths[column.key];
        const width = override ? `${override}px` : resolvedWidths[index];
        const flexible = override == null && isFrWidth(column.width);
        const minWidth = headerMinWidth(
          column,
          minColumnWidth,
          reorderable ? REORDER_HANDLE_PX : 0
        );
        return (
          <col
            key={column.key}
            style={colWidthStyle(width, flexible, minWidth)}
          />
        );
      })}
      <col style={hasFlexibleColumn ? { width: 0 } : undefined} />
    </colgroup>
  );
  const resolvedHeight = Math.max(height, minHeight ?? 0);
  // Snap the body to a whole number of rows so separators land exactly on the
  // bottom border instead of a partial row peeking out above it.
  const bodyHeight =
    Math.floor(Math.max(rowHeight, resolvedHeight - rowHeight) / rowHeight) *
    rowHeight;
  const minBodyHeight =
    minHeight == null
      ? 0
      : Math.floor(Math.max(rowHeight, minHeight - rowHeight) / rowHeight) *
        rowHeight;
  const contentHeight = Math.max(
    rowHeight,
    Math.min(bodyHeight, pagedRows.length * rowHeight)
  );
  const scrolls = pagedRows.length * rowHeight > bodyHeight;
  const viewportHeight = scrolls
    ? bodyHeight
    : Math.max(
        pagedRows.length === 0 ? bodyHeight : contentHeight,
        minBodyHeight
      );
  const renderedRows = scrolls
    ? virtualItems.flatMap((item) => {
        const entry = pagedRows[item.index];
        return entry ? [{ entry, index: item.index }] : [];
      })
    : pagedRows.map((entry, index) => ({ entry, index }));

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
  // A styled ::-webkit-scrollbar is a classic scrollbar: a horizontal one eats
  // into the fixed viewport height, so rows no longer land on the rowHeight
  // grid against the bottom border. Grow the container by its thickness.
  const [hScrollbarPx, setHScrollbarPx] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const styles = getComputedStyle(el);
      const borders =
        Number.parseFloat(styles.borderTopWidth) +
        Number.parseFloat(styles.borderBottomWidth);
      setHScrollbarPx(Math.max(0, el.offsetHeight - el.clientHeight - borders));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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
      {/* Overlap (>= rounded-2xl) hides the header's side border in the body radius. */}
      <div
        className={cn(
          "border-border bg-muted overflow-hidden rounded-t-2xl border border-b-0 pb-5",
          flushTop && "rounded-t-none border-t-0",
          overlapTop && "pt-5"
        )}
      >
        {toolbar ? (
          <div className="border-border bg-background border-b">{toolbar}</div>
        ) : null}
        <div
          className="overflow-hidden"
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
              minColumnWidth={minColumnWidth}
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
      </div>

      <div
        className={cn(
          "scrollbar-floating border-border bg-background relative -mt-5 box-content rounded-2xl border outline-none",
          scrolls ? "overflow-auto" : "overflow-x-auto overflow-y-hidden",
          flushBottom && !footer && "rounded-b-none"
        )}
        onScroll={handleScroll}
        ref={scrollRef}
        style={
          scrolls
            ? {
                height: viewportHeight + hScrollbarPx,
                scrollbarGutter: "stable",
              }
            : { height: viewportHeight + hScrollbarPx }
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
            {pagedRows.length === 0 ? (
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
                      className="text-muted-foreground flex items-center justify-center px-6 text-center"
                      style={{ height: bodyHeight }}
                    >
                      {emptyState}
                    </div>
                  </td>
                </tr>
              )
            ) : (
              <>
                {scrolls && paddingTop > 0 ? (
                  <tr aria-hidden style={{ height: paddingTop }}>
                    <td colSpan={leadColumns + 1} />
                  </tr>
                ) : null}
                {renderedRows.map(({ entry, index }) => {
                  return (
                    <TableBodyRow
                      columns={orderedColumns}
                      entry={entry}
                      hasRowMenu={hasRowMenu}
                      index={index}
                      isLastRow={index === pagedRows.length - 1}
                      isSelected={selected.has(entry.id)}
                      key={entry.id}
                      onActivate={activateRow}
                      onCellEdit={onCellEdit}
                      onDeactivate={deactivateRow}
                      onRowClick={onRowClick}
                      onRowPointerEnter={onRowPointerEnter}
                      onToggleRow={toggleRow}
                      renderRowContextMenu={renderRowContextMenu}
                      rowHeight={rowHeight}
                      rowRef={(el) => {
                        rowRefs.current[entry.id] = el;
                      }}
                      selectable={selectable}
                    />
                  );
                })}
                {scrolls && paddingBottom > 0 ? (
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
      {footer ? (
        <div
          className={cn(
            "border-border bg-muted -mt-5 rounded-b-2xl border border-t-0 pt-5",
            flushBottom && "rounded-b-none border-b-0"
          )}
        >
          {footer}
        </div>
      ) : null}
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
