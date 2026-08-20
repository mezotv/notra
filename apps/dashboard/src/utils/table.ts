import { GEO_VISIBILITY_TABLE_ROWS } from "@/constants/geo";
import {
  TABLE_MAX_HEIGHT,
  TABLE_MIN_ROWS,
  TABLE_ROW_HEIGHT,
} from "@/constants/table";

export function tableHeightFor(rowCount: number): number {
  const rows = Math.max(rowCount, TABLE_MIN_ROWS);
  return Math.min(TABLE_MAX_HEIGHT, (rows + 1) * TABLE_ROW_HEIGHT);
}

export const GEO_VISIBILITY_TABLE_HEIGHT = tableHeightFor(
  GEO_VISIBILITY_TABLE_ROWS
);
