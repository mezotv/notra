"use client";

import { Delete02Icon, SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  COMPETITOR_TYPE_FILTER_VALUES,
  COMPETITOR_TYPE_FILTERS,
  COMPETITORS_TABLE_HEIGHT,
  COMPETITORS_TABLE_ROW_HEIGHT,
} from "@/constants/geo";
import { useGeoCompetitorDelete } from "@/lib/hooks/use-geo";
import type {
  CompetitorsTableProps,
  GeoCompetitorRowEntry,
  GeoCompetitorTypeFilter,
} from "@/types/geo";
import {
  buildCompetitorRows,
  findOwnBrandDomain,
  formatCompetitorKind,
} from "@/utils/geo-competitors";

function toTypeFilter(value: string): GeoCompetitorTypeFilter {
  if (value === "direct" || value === "indirect") {
    return value;
  }
  return "all";
}

export function CompetitorsTable({
  competitors,
  organizationId,
  organizationSlug,
  companyName,
  aliases,
}: CompetitorsTableProps) {
  const router = useRouter();
  const remove = useGeoCompetitorDelete(organizationId);
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral(COMPETITOR_TYPE_FILTER_VALUES)
      .withDefault("all")
      .withOptions({ clearOnDefault: true })
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const ownDomain = useMemo(() => findOwnBrandDomain(aliases), [aliases]);

  const rows = useMemo(
    () =>
      buildCompetitorRows(
        competitors,
        companyName,
        ownDomain,
        search,
        typeFilter
      ),
    [competitors, companyName, ownDomain, search, typeFilter]
  );

  const selectedNames = useMemo(
    () =>
      rows
        .filter((row) => !row.isOwnBrand && selectedIds.includes(row.id))
        .map((row) => row.name),
    [rows, selectedIds]
  );

  const columns = useMemo<TableColumn<GeoCompetitorRowEntry>[]>(
    () => [
      {
        key: "name",
        header: (
          <span className="inline-flex items-center gap-1.5">
            Brand
            <span className="font-normal text-muted-foreground tabular-nums">
              ({rows.length})
            </span>
          </span>
        ),
        sortable: true,
        width: "1.6fr",
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <CompetitorLogo
              className="size-6 shrink-0 rounded-md"
              domain={row.domain}
              name={row.name}
            />
            <span className="truncate font-medium">
              {row.name}
              {row.isOwnBrand && (
                <span className="ml-1 text-muted-foreground">(You)</span>
              )}
            </span>
          </span>
        ),
      },
      {
        key: "domain",
        header: "Domain",
        width: "1.4fr",
        cell: (row) =>
          row.domain ? (
            <a
              className="text-muted-foreground hover:text-foreground hover:underline"
              href={`https://${row.domain}`}
              onClick={(event) => event.stopPropagation()}
              rel="noopener"
              target="_blank"
            >
              {row.domain}
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        key: "color",
        header: "Color",
        width: "5.625rem",
        cell: (row) => (
          <span
            aria-hidden="true"
            className="block size-5 rounded-md"
            style={{ backgroundColor: row.color.light }}
          />
        ),
      },
      {
        key: "kind",
        header: "Type",
        width: "7.5rem",
        sortable: true,
        cell: (row) =>
          row.isOwnBrand ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <Badge variant={row.kind === "direct" ? "default" : "secondary"}>
              {formatCompetitorKind(row.kind)}
            </Badge>
          ),
      },
      {
        key: "synonyms",
        header: "Synonyms",
        width: "1.2fr",
        cell: (row) =>
          row.synonyms.length > 0 ? (
            <span
              className="truncate text-muted-foreground"
              title={row.synonyms.join(", ")}
            >
              {row.synonyms.join(", ")}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        sortValue: (row) => row.synonyms.length,
      },
      {
        key: "actions",
        header: "",
        width: "4rem",
        align: "right",
        cell: (row) =>
          row.isOwnBrand ? null : (
            <Button
              aria-label={`Remove ${row.name}`}
              disabled={remove.isPending}
              onClick={(event) => {
                event.stopPropagation();
                remove.mutate({ name: row.name });
              }}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </Button>
          ),
      },
    ],
    [remove, rows.length]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <HugeiconsIcon
            className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground"
            icon={SearchIcon}
            size={15}
          />
          <Input
            aria-label="Filter competitors by name"
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by name..."
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => setTypeFilter(toTypeFilter(value ?? "all"))}
          value={typeFilter}
        >
          <SelectTrigger className="w-40 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPETITOR_TYPE_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedNames.length > 0 && (
          <Button
            disabled={remove.isPending}
            onClick={() => {
              for (const name of selectedNames) {
                remove.mutate({ name });
              }
              setSelectedIds([]);
            }}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            Remove {selectedNames.length}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Table
          className="rounded-2xl"
          columns={columns}
          data={rows}
          defaultSort={{ key: "name", direction: "asc" }}
          emptyState="No competitors match these filters"
          getRowId={(row) => row.id}
          height={COMPETITORS_TABLE_HEIGHT}
          onRowClick={(row) => {
            if (!row.isOwnBrand) {
              router.push(
                `/${organizationSlug}/geo/competitors/${encodeURIComponent(row.name)}`
              );
            }
          }}
          onSelectionChange={setSelectedIds}
          resizable
          rowHeight={COMPETITORS_TABLE_ROW_HEIGHT}
          selectable
          selectedRowIds={selectedIds}
        />
      </div>
    </div>
  );
}
