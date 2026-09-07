import type { TableColumn } from "@/components/motion/table";

export interface DataTableEmptyState {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export interface DataTableProps<TData> {
  columns: TableColumn<TData>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyState?: DataTableEmptyState;
  onRowClick?: (row: TData) => void;
}
