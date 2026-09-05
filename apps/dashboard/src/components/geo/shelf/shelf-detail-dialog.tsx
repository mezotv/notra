"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { engineFamilyLabel } from "@notra/geo-core/utils/geo-engine-family";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";

import { Button } from "@/components/button";
import { EngineIcon } from "@/components/geo/engine-icon";
import { ShelfPlacementsTable } from "@/components/geo/shelf/shelf-placements-table";
import { ShelfTicketForm } from "@/components/geo/shelf/shelf-ticket-form";
import {
  GEO_SHELF_CITATION_WINDOW_DAYS,
  GEO_SHELF_FETCH_STATUS_LABELS,
  GEO_SHELF_OWNERSHIP_LABELS,
  GEO_SHELF_SOURCE_KIND_LABELS,
} from "@/constants/geo-shelf";
import type { GeoShelfDetailDialogProps } from "@/types/geo-shelf";
import { formatRelative } from "@/utils/format-relative";
import { formatShelfDate } from "@/utils/geo-shelf";

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
      {children}
    </h3>
  );
}

export function ShelfDetailDialog({
  open,
  onOpenChange,
  row,
  members,
  currentMemberId,
  ownBrandName,
  onUpdateOpportunity,
  onSetPlacementStatus,
  isPending,
}: GeoShelfDetailDialogProps) {
  if (!row) {
    return null;
  }
  const citations = row.citations;
  const stats = [
    {
      label: `Cited, last ${GEO_SHELF_CITATION_WINDOW_DAYS}d`,
      value: citations.windowCount.toLocaleString(),
    },
    { label: "Cited, all time", value: citations.totalCount.toLocaleString() },
    { label: "Prompts", value: citations.promptCount.toLocaleString() },
    { label: "First cited", value: formatShelfDate(citations.firstCitedAt) },
    { label: "Last cited", value: formatShelfDate(citations.lastCitedAt) },
  ];

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {GEO_SHELF_SOURCE_KIND_LABELS[row.kind]}
            </Badge>
            <Badge variant="outline">
              {GEO_SHELF_OWNERSHIP_LABELS[row.ownership]}
            </Badge>
            <Badge variant="outline">
              {GEO_SHELF_FETCH_STATUS_LABELS[row.fetchStatus]}
            </Badge>
          </div>
          <ResponsiveDialogTitle className="text-xl font-semibold">
            {row.title ?? row.domain}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="flex min-w-0 items-center gap-2">
            <a
              className="hover:text-foreground truncate underline-offset-4 hover:underline"
              href={row.url}
              rel="noopener"
              target="_blank"
            >
              {row.url}
            </a>
            <HugeiconsIcon
              className="size-3.5 shrink-0"
              icon={ArrowUpRight01Icon}
            />
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-6">
          <section className="space-y-2">
            <SectionTitle>Citations</SectionTitle>
            <dl className="bg-card divide-border grid grid-cols-2 divide-x rounded-xl border sm:grid-cols-5">
              {stats.map((stat) => (
                <div
                  className="flex min-w-0 flex-col gap-0.5 px-3 py-2"
                  key={stat.label}
                >
                  <dt className="text-muted-foreground truncate text-xs">
                    {stat.label}
                  </dt>
                  <dd className="m-0 text-base font-semibold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            {citations.engines.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {citations.engines.map((engine) => (
                  <Badge className="gap-1.5" key={engine} variant="outline">
                    <EngineIcon className="size-3.5" engine={engine} />
                    {engineFamilyLabel(engine)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No engine has cited this page for your prompts yet.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <SectionTitle>Who is on the shelf</SectionTitle>
              {row.lastFetchedAt ? (
                <span className="text-muted-foreground text-xs">
                  Page checked {formatRelative(row.lastFetchedAt)}
                </span>
              ) : null}
            </div>
            <ShelfPlacementsTable
              disabled={isPending}
              onSetPlacementStatus={onSetPlacementStatus}
              ownBrandName={ownBrandName}
              row={row}
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Ticket</SectionTitle>
              {row.opportunity ? (
                <span className="text-muted-foreground text-xs">
                  Opened {formatRelative(row.opportunity.createdAt)}
                  {row.opportunity.resolvedAt
                    ? `, closed ${formatRelative(row.opportunity.resolvedAt)}`
                    : ""}
                </span>
              ) : null}
            </div>
            {row.opportunity ? (
              <ShelfTicketForm
                currentMemberId={currentMemberId}
                disabled={isPending}
                members={members}
                onChange={(changes) => onUpdateOpportunity(row.id, changes)}
                opportunity={row.opportunity}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  {row.isOpportunity
                    ? "Competitors are listed here and you are not. Open a ticket to work on it."
                    : "No one is working on this page."}
                </p>
                <Button
                  disabled={isPending}
                  onClick={() =>
                    onUpdateOpportunity(row.id, {
                      status: "open",
                      assigneeMemberId: currentMemberId,
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Open ticket
                </Button>
              </div>
            )}
          </section>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
