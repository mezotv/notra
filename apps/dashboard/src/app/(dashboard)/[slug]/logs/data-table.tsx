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
import { useState } from "react";
import { Button } from "@/components/button";
import type { DataTableProps } from "@/types/logs/data-table";

export function DataTable<TData>({
  columns,
  data,
  page,
  totalPages,
  onPageChange,
  isLoading,
  emptyState,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
      <div className="overflow-hidden rounded-lg border">
        <Table>
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
          <TableBody>
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
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
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
                      <p className="font-medium text-sm">{emptyState.title}</p>
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
