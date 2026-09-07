"use client";

import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { tableHeightFor } from "@/utils/table";

interface DataTableProps<TData> {
  columns: TableColumn<TData>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const SKELETON_ROW_COUNT = 3;

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading,
  emptyMessage = "No data found.",
}: DataTableProps<TData>) {
  const rowCount = isLoading ? SKELETON_ROW_COUNT : data.length;

  return (
    <Table
      className="rounded-2xl"
      columns={columns}
      data={data}
      emptyState={emptyMessage}
      getRowId={getRowId}
      height={tableHeightFor(rowCount, TABLE_ROW_HEIGHT)}
      loading={isLoading}
      rowHeight={TABLE_ROW_HEIGHT}
    />
  );
}
