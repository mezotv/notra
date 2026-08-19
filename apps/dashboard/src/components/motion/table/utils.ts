import type { ReactNode } from "react";
import type { TableColumn } from "./types";

export const CHECKBOX_WIDTH = "3rem";

/** Highlights the top edge of the active column's header cell. */
export const COLUMN_ACTIVE_SHADOW = "inset 0 1px 0 var(--color-primary)";

/** Inner box for table cells. Gives children a real used width so truncate /
 * max-width:100% resolve against the column, not the td's max-w-0 hack. */
export const TABLE_CELL_INNER_CLASS =
  "w-full min-w-0 truncate [&>*]:min-w-0 [&>*]:max-w-full";

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

export function isFrWidth(width: string | undefined): boolean {
  return width != null && FR_WIDTH_REGEX.test(width);
}

export function colWidthStyle(
  width: string | undefined,
  flexible: boolean
): { width: string; minWidth?: string } | undefined {
  if (!width) {
    return undefined;
  }
  if (flexible) {
    return { width };
  }
  return { width, minWidth: width };
}

export function resolveColumnWidths<T>(
  columns: readonly TableColumn<T>[],
  extraFixedWidths: readonly string[] = []
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

  const fixedWidths = [
    ...extraFixedWidths,
    ...columns.flatMap((column, index) =>
      frValues[index] == null && column.width ? [column.width] : []
    ),
  ];
  const remainder =
    fixedWidths.length > 0 ? `100% - ${fixedWidths.join(" - ")}` : null;

  return columns.map((column, index) => {
    const fr = frValues[index];
    if (fr === null || fr === undefined) {
      return column.width;
    }
    if (!remainder) {
      return `${((fr / totalFr) * 100).toFixed(PERCENT_DECIMALS)}%`;
    }
    return `calc((${remainder}) * ${fr} / ${totalFr})`;
  });
}
