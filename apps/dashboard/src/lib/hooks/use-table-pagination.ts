"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback } from "react";

import { TABLE_PAGE_SIZE } from "@/constants/table";
import type {
  TablePaginationState,
  UseTablePaginationOptions,
} from "@/types/table";
import { pageRowCount } from "@/utils/table";

export function useTablePagination({
  key,
  totalItems,
  pageSize = TABLE_PAGE_SIZE,
}: UseTablePaginationOptions): TablePaginationState {
  const [rawPage, setRawPage] = useQueryState(
    key,
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, rawPage), pageCount);

  const setPage = useCallback(
    (next: number) => {
      setRawPage(Math.min(Math.max(1, next), pageCount));
    },
    [pageCount, setRawPage]
  );

  return {
    page,
    pageCount,
    pageSize,
    totalItems,
    pageRowCount: pageRowCount(page, pageSize, totalItems),
    setPage,
  };
}
