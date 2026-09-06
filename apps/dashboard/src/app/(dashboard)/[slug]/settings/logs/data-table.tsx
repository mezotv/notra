"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "@/types/logs/data-table";

const INTERACTIVE_ROW_TARGET_SELECTOR =
  "a, button, input, textarea, select, [role='menuitem'], [data-slot='dropdown-menu-trigger']";

export function DataTable<TData>({
  columns,
  contentKey,
  data,
  page,
  totalPages,
  onPageChange,
  isLoading,
  emptyState,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, row: TData) {
    if (!onRowClick) {
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest(INTERACTIVE_ROW_TARGET_SELECTOR)
    ) {
      return;
    }
    onRowClick(row);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    row: TData
  ) {
    if (!onRowClick) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    onRowClick(row);
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    state: {
      sorting,
    },
  });

  return (
    <div>
      <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border">
        <Table aria-busy={isLoading} className="table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[24%]" />
            <col className="w-[16%]" />
            <col className="w-[17%]" />
            <col className="w-[3%]" />
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className="animate-[logs-table-content-fade_100ms_ease-out] motion-reduce:animate-none"
            key={contentKey}
          >
            {isLoading && (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              table.getRowModel().rows?.length > 0 &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  aria-label="View log details"
                  className={cn(
                    onRowClick &&
                      "hover:bg-muted/60 focus-visible:bg-muted/60 cursor-pointer focus-visible:outline-none"
                  )}
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={(event) => handleRowClick(event, row.original)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.original)}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!(isLoading || table.getRowModel().rows?.length) && (
              <TableRow>
                <TableCell
                  className="h-32 text-center"
                  colSpan={columns.length}
                >
                  {emptyState ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <p className="text-sm font-medium">{emptyState.title}</p>
                      {emptyState.description && (
                        <p className="text-muted-foreground text-sm">
                          {emptyState.description}
                        </p>
                      )}
                      {emptyState.actionLabel && emptyState.onActionClick && (
                        <Button
                          className="mt-2"
                          onClick={emptyState.onActionClick}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {emptyState.actionLabel}
                        </Button>
                      )}
                    </div>
                  ) : (
                    "No results."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {(totalPages > 1 || data.length > 0) && (
        <div className="flex items-center justify-between py-4">
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
