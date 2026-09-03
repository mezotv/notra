"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_PROMPT_HISTORY_ANSWER_LABELS,
  GEO_PROMPT_HISTORY_CHANGE_LABELS,
  GEO_PROMPT_HISTORY_COLUMN_LABELS,
  GEO_PROMPT_HISTORY_EMPTY_COMPETITORS,
  GEO_PROMPT_HISTORY_EMPTY_POSITION,
  GEO_PROMPT_HISTORY_PREVIEW_ROWS,
  GEO_PROMPT_HISTORY_SKELETON_ROWS,
  GEO_PROMPT_RECEIPT_LABELS,
} from "@notra/geo-core/constants/geo";
import { findCompetitorDomain } from "@notra/geo-core/geo/domain";
import type {
  GeoCompetitor,
  GeoPromptHistoryCheck,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { TablePagination } from "@notra/ui/components/shared/table-pagination";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useState } from "react";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { PromptOutcomeIcon } from "@/components/geo/prompt-outcome-icon";
import { cn } from "@/lib/utils";
import type {
  PromptHistoryChange,
  PromptHistoryEntry,
  PromptReceiptHistoryProps,
} from "@/types/geo";
import {
  promptHistoryChangeLabel,
  promptOutcomeLabel,
} from "@/utils/geo-prompt-history";
import { pageRowCount } from "@/utils/table";

const SKELETON_KEYS = Array.from(
  { length: GEO_PROMPT_HISTORY_SKELETON_ROWS },
  (_, index) => `history-skeleton-${index}`
);

const CELL_CLASS = "py-3 align-top";
const SCAN_COLUMN_CLASS = "w-36";
const OUTCOME_COLUMN_CLASS = "w-36";
const POSITION_COLUMN_CLASS = "w-20";
const CHANGES_COLUMN_CLASS = "w-48";
const ACTION_COLUMN_CLASS = "w-10 pr-2 pl-0";

function positionLabel(position: number | null): string {
  return position === null ? GEO_PROMPT_HISTORY_EMPTY_POSITION : `#${position}`;
}

function PositionChip({
  position,
  tone = "neutral",
}: {
  position: number | null;
  tone?: "neutral" | "up";
}) {
  if (position === null) {
    return (
      <span className="text-muted-foreground/70">
        {GEO_PROMPT_RECEIPT_LABELS.notRanked}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm px-1 text-xs font-medium tabular-nums",
        tone === "up" ? "bg-geo-up/10 text-geo-up" : "bg-muted text-foreground"
      )}
    >
      {positionLabel(position)}
    </span>
  );
}

function BrandToken({
  name,
  competitors,
}: {
  name: string;
  competitors: readonly GeoCompetitor[] | undefined;
}) {
  return (
    <span className="text-foreground inline-flex h-5 items-center gap-1 font-medium">
      <CompetitorLogo
        className="size-3.5 rounded-[3px]"
        domain={findCompetitorDomain(competitors, name)}
        name={name}
      />
      {name}
    </span>
  );
}

function ChangeWords({ change }: { change: PromptHistoryChange }) {
  switch (change.kind) {
    case "gained":
      return (
        <>
          <span className="text-geo-up font-medium">
            {GEO_PROMPT_HISTORY_CHANGE_LABELS.gainedMention}
          </span>
          {change.position === null ? null : (
            <>
              <span>{GEO_PROMPT_HISTORY_CHANGE_LABELS.gainedMentionAt}</span>
              <PositionChip position={change.position} tone="up" />
            </>
          )}
        </>
      );
    case "lost":
      return (
        <span className="text-geo-down font-medium">
          {GEO_PROMPT_HISTORY_CHANGE_LABELS.lostMention}
        </span>
      );
    case "position":
      return (
        <>
          <span>{GEO_PROMPT_HISTORY_CHANGE_LABELS.moved}</span>
          <PositionChip position={change.from} />
          <span>→</span>
          <PositionChip position={change.to} />
        </>
      );
    default:
      return (
        <span className="text-muted-foreground/70">
          {promptHistoryChangeLabel(change)}
        </span>
      );
  }
}

function ChangesCell({ entry }: { entry: PromptHistoryEntry }) {
  return (
    <ul className="flex flex-col gap-1">
      {entry.changes.map((change) => (
        <li
          className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-sm leading-5"
          key={`${entry.check.id}-${change.kind}`}
        >
          <span className="sr-only">{promptHistoryChangeLabel(change)}</span>
          <span aria-hidden="true" className="contents">
            <ChangeWords change={change} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function NewCompetitorsCell({
  names,
  competitors,
}: {
  names: readonly string[];
  competitors: readonly GeoCompetitor[] | undefined;
}) {
  if (names.length === 0) {
    return (
      <span className="text-muted-foreground/60 inline-flex h-5 items-center">
        {GEO_PROMPT_HISTORY_EMPTY_COMPETITORS}
      </span>
    );
  }
  return (
    <ul className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5">
      {names.map((name) => (
        <li className="contents" key={name}>
          <BrandToken competitors={competitors} name={name} />
        </li>
      ))}
    </ul>
  );
}

function HistoryRow({
  entry,
  competitors,
  onSelect,
}: {
  entry: PromptHistoryEntry;
  competitors: readonly GeoCompetitor[] | undefined;
  onSelect?: (check: GeoPromptHistoryCheck) => void;
}) {
  const { check } = entry;
  const selectable = Boolean(onSelect);
  const actionLabel = `${GEO_PROMPT_HISTORY_ANSWER_LABELS.viewAnswer} · ${formatAiTrafficTimestamp(check.capturedAt)}`;
  return (
    <TableRow
      className={cn(selectable && "group cursor-pointer")}
      onClick={selectable ? () => onSelect?.(check) : undefined}
    >
      <TableCell className={cn(CELL_CLASS, SCAN_COLUMN_CLASS)}>
        <time
          className="inline-flex h-5 items-center tabular-nums"
          dateTime={check.capturedAt}
          title={check.scanId}
        >
          {formatAiTrafficTimestamp(check.capturedAt)}
        </time>
      </TableCell>
      <TableCell className={cn(CELL_CLASS, OUTCOME_COLUMN_CLASS)}>
        <span className="inline-flex h-5 items-center gap-2">
          <PromptOutcomeIcon mentioned={check.mentioned} />
          <span
            className={
              check.mentioned ? "text-foreground" : "text-muted-foreground"
            }
          >
            {promptOutcomeLabel(check.mentioned)}
          </span>
        </span>
      </TableCell>
      <TableCell className={cn(CELL_CLASS, POSITION_COLUMN_CLASS)}>
        <span
          className={cn(
            "inline-flex h-5 items-center tabular-nums",
            check.position === null
              ? "text-muted-foreground/60"
              : "text-foreground"
          )}
        >
          {positionLabel(check.position)}
        </span>
      </TableCell>
      <TableCell
        className={cn(CELL_CLASS, CHANGES_COLUMN_CLASS, "whitespace-normal")}
      >
        <ChangesCell entry={entry} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "whitespace-normal")}>
        <NewCompetitorsCell
          competitors={competitors}
          names={entry.newCompetitors}
        />
      </TableCell>
      {selectable ? (
        <TableCell className={cn(CELL_CLASS, ACTION_COLUMN_CLASS)}>
          <button
            aria-label={actionLabel}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-5 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(check);
            }}
            title={GEO_PROMPT_HISTORY_ANSWER_LABELS.viewAnswer}
            type="button"
          >
            <HugeiconsIcon
              className="size-4"
              icon={ArrowRight01Icon}
              strokeWidth={2}
            />
          </button>
        </TableCell>
      ) : null}
    </TableRow>
  );
}

function SkeletonRow({ selectable }: { selectable: boolean }) {
  return (
    <TableRow>
      <TableCell className={CELL_CLASS}>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      {selectable ? (
        <TableCell className={cn(CELL_CLASS, ACTION_COLUMN_CLASS)} />
      ) : null}
    </TableRow>
  );
}

const HISTORY_PAGE_SIZE = GEO_PROMPT_HISTORY_PREVIEW_ROWS;

export function PromptReceiptHistory({
  entries,
  isLoading,
  competitors,
  onSelect,
}: PromptReceiptHistoryProps) {
  const [requestedPage, setPage] = useState(1);
  const selectable = Boolean(onSelect);

  const totalItems = entries.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / HISTORY_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  if (!isLoading && entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {GEO_PROMPT_RECEIPT_LABELS.noHistory}
      </p>
    );
  }

  const visible = isLoading
    ? []
    : entries.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);
  const paginated = totalItems > HISTORY_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={SCAN_COLUMN_CLASS}>
                {GEO_PROMPT_HISTORY_COLUMN_LABELS.date}
              </TableHead>
              <TableHead className={OUTCOME_COLUMN_CLASS}>
                {GEO_PROMPT_HISTORY_COLUMN_LABELS.outcome}
              </TableHead>
              <TableHead className={POSITION_COLUMN_CLASS}>
                {GEO_PROMPT_HISTORY_COLUMN_LABELS.position}
              </TableHead>
              <TableHead className={CHANGES_COLUMN_CLASS}>
                {GEO_PROMPT_HISTORY_COLUMN_LABELS.changes}
              </TableHead>
              <TableHead>
                {GEO_PROMPT_HISTORY_COLUMN_LABELS.newCompetitors}
              </TableHead>
              {selectable ? (
                <TableHead className={ACTION_COLUMN_CLASS}>
                  <span className="sr-only">
                    {GEO_PROMPT_HISTORY_ANSWER_LABELS.viewAnswer}
                  </span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading}>
            {isLoading
              ? SKELETON_KEYS.map((key) => (
                  <SkeletonRow key={key} selectable={selectable} />
                ))
              : visible.map((entry) => (
                  <HistoryRow
                    competitors={competitors}
                    entry={entry}
                    key={entry.check.id}
                    onSelect={onSelect}
                  />
                ))}
          </TableBody>
        </Table>
        {!isLoading && paginated ? (
          <div className="border-t">
            <TablePagination
              page={page}
              pageCount={pageCount}
              pageRowCount={pageRowCount(page, HISTORY_PAGE_SIZE, totalItems)}
              pageSize={HISTORY_PAGE_SIZE}
              setPage={setPage}
              totalItems={totalItems}
            />
          </div>
        ) : null}
      </div>
      {entries.length === 1 ? (
        <p className="text-muted-foreground text-xs">
          {GEO_PROMPT_RECEIPT_LABELS.singleScan}
        </p>
      ) : null}
    </div>
  );
}
