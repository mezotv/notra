"use client";

import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { PurposeBadge } from "@notra/ui/components/geo/purpose-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import { LIVE_TRAFFIC_TIMESTAMP_PLACEHOLDER } from "@/constants/landing/live-traffic";
import { formatCapturedAt } from "@/lib/landing/live-traffic";
import type { CitationRowsProps, LiveCitationRow } from "@/types/landing/geo";

const HEADER_CLASS = "h-11 text-muted-foreground text-sm";
const BODY_CLASS =
  "[&_tr:first-child>td:first-child]:rounded-none [&_tr:first-child>td:last-child]:rounded-none";

const ROW_ENTER = { opacity: 0, y: -12 } as const;
const ROW_VISIBLE = { opacity: 1, y: 0 } as const;
const ROW_EXIT = { opacity: 0 } as const;
const ROW_TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

function CitationCells({
  row,
  base,
}: {
  row: LiveCitationRow;
  base: number | null;
}) {
  return (
    <>
      <TableCell className="whitespace-nowrap py-3.5 text-muted-foreground text-sm tabular-nums">
        {base === null ? (
          <span className="invisible">
            {LIVE_TRAFFIC_TIMESTAMP_PLACEHOLDER}
          </span>
        ) : (
          formatCapturedAt(row, base)
        )}
      </TableCell>
      <TableCell className="py-3.5">
        <span className="flex items-center gap-2.5 whitespace-nowrap font-medium text-[0.9375rem]">
          <EngineIcon className="size-4.5" engine={row.engine} />
          {row.provider}
        </span>
      </TableCell>
      <TableCell className="py-3.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate font-mono text-[0.8125rem] text-muted-foreground">
            {row.path}
          </span>
          {row.markdown ? (
            <span className="inline-flex h-4.5 shrink-0 items-center rounded border border-border px-1 font-mono text-[0.6875rem] text-muted-foreground leading-none">
              MD
            </span>
          ) : null}
        </span>
      </TableCell>
      <TableCell className="py-3.5">
        <PurposeBadge category={row.purpose} />
      </TableCell>
    </>
  );
}

export function CitationRows({
  rows,
  base,
  animated,
  headers,
}: CitationRowsProps) {
  return (
    <Table className="table-fixed">
      <TableHeader className="sticky top-0 z-10 bg-muted">
        <TableRow>
          <TableHead className={cn(HEADER_CLASS, "w-[11.5rem]")}>
            {headers.when}
          </TableHead>
          <TableHead className={cn(HEADER_CLASS, "w-[14rem]")}>
            {headers.provider}
          </TableHead>
          <TableHead className={HEADER_CLASS}>{headers.path}</TableHead>
          <TableHead className={cn(HEADER_CLASS, "w-[11.5rem]")}>
            {headers.purpose}
          </TableHead>
        </TableRow>
      </TableHeader>
      {animated ? (
        <LazyMotion features={domAnimation}>
          <TableBody className={BODY_CLASS}>
            <AnimatePresence initial={false}>
              {rows.map((row) => (
                <m.tr
                  animate={ROW_VISIBLE}
                  className="[&>td]:border-border [&>td]:border-b"
                  exit={ROW_EXIT}
                  initial={ROW_ENTER}
                  key={row.id}
                  layout="position"
                  transition={ROW_TRANSITION}
                >
                  <CitationCells base={base} row={row} />
                </m.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </LazyMotion>
      ) : (
        <TableBody className={BODY_CLASS}>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <CitationCells base={base} row={row} />
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
