export interface UseTablePaginationOptions {
  key: string;
  totalItems: number;
  pageSize?: number;
  isReady?: boolean;
}

export interface TablePaginationState {
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  pageRowCount: number;
  setPage: (page: number) => void;
}

export interface TablePaginationProps extends TablePaginationState {
  itemLabel?: string;
  className?: string;
}
