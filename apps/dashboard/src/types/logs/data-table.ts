import type { ColumnDef } from "@tanstack/react-table";

export interface DataTableEmptyState {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export interface DataTableProps<TData> {
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Table columns have varying value types
  columns: ColumnDef<TData, any>[];
  data: TData[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyState?: DataTableEmptyState;
}
