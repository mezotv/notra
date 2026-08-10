import type { ReactNode } from "react";
import type { TableColumn } from "./types";

export const CHECKBOX_WIDTH = "3rem";

/** Highlights the top edge of the active column's header cell. */
export const COLUMN_ACTIVE_SHADOW = "inset 0 1px 0 var(--color-primary)";

export function alignFlex(align: TableColumn<unknown>["align"]) {
  if (align === "right") {
    return "justify-end";
  }
  if (align === "center") {
    return "justify-center";
  }
  return "justify-start";
}

export function alignText(align: TableColumn<unknown>["align"]) {
  if (align === "right") {
    return "text-right";
  }
  if (align === "center") {
    return "text-center";
  }
  return "text-left";
}

export function readCell<T>(row: T, column: TableColumn<T>): ReactNode {
  if (column.cell) {
    return column.cell(row);
  }
  return (row as Record<string, ReactNode>)[column.key];
}

export function readSortValue<T>(
  row: T,
  column: TableColumn<T>
): string | number {
  if (column.sortValue) {
    return column.sortValue(row);
  }
  return (row as Record<string, string | number>)[column.key] ?? "";
}

const FR_WIDTH_REGEX = /^([\d.]+)fr$/;

const PERCENT_DECIMALS = 4;

export function resolveColumnWidths<T>(
  columns: readonly TableColumn<T>[]
): (string | undefined)[] {
  const frValues = columns.map((column) => {
    const match = column.width ? FR_WIDTH_REGEX.exec(column.width) : null;
    return match ? Number.parseFloat(match[1] ?? "0") : null;
  });
  const totalFr = frValues.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  );
  if (totalFr === 0) {
    return columns.map((column) => column.width);
  }

  return columns.map((column, index) => {
    const fr = frValues[index];
    if (fr === null || fr === undefined) {
      return column.width;
    }
    return `${((fr / totalFr) * 100).toFixed(PERCENT_DECIMALS)}%`;
  });
}
