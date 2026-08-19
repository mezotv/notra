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
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { GeoRemoveDialog } from "@/components/geo/geo-remove-dialog";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  PROMPT_SOURCE_FILTER_VALUES,
  PROMPT_SOURCE_FILTERS,
  PROMPTS_TABLE_HEIGHT,
  PROMPTS_TABLE_ROW_HEIGHT,
} from "@/constants/geo";
import { useGeoPromptDelete, useGeoPromptToggle } from "@/lib/hooks/use-geo";
import type {
  GeoPromptSourceFilter,
  GeoPromptTableRow,
  PromptsTableProps,
} from "@/types/geo";
import {
  buildPromptTableRows,
  formatPromptSource,
  promptPresenceSortValue,
} from "@/utils/geo-prompts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

const PROMPT_NOUNS = { singular: "prompt", plural: "prompts" } as const;

function promptRemoveDescription(items: string[]): string {
  if (items.length > 1) {
    return "These questions will no longer be asked in GEO scans. Historical answers stay in your results.";
  }
  return `"${items[0]}" will no longer be asked in GEO scans. Historical answers stay in your results.`;
}

function toSourceFilter(value: string): GeoPromptSourceFilter {
  if (value === "custom" || value === "auto") {
    return value;
  }
  return "all";
}

export function PromptsTable({
  organizationId,
  prompts,
  results,
  isScanning = false,
}: PromptsTableProps) {
  const toggle = useGeoPromptToggle(organizationId);
  const remove = useGeoPromptDelete(organizationId);
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringLiteral(PROMPT_SOURCE_FILTER_VALUES)
      .withDefault("all")
      .withOptions({ clearOnDefault: true })
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GeoPromptTableRow[]>([]);
  const [detail, setDetail] = useState<GeoPromptTableRow | null>(null);

  const rows = useMemo(
    () => buildPromptTableRows(prompts, results, search, sourceFilter),
    [prompts, results, search, sourceFilter]
  );

  const selectedCustomRows = useMemo(
    () =>
      rows.filter(
        (row) => row.source === "custom" && selectedIds.includes(row.id)
      ),
    [rows, selectedIds]
  );

  const requestDelete = useCallback((targets: GeoPromptTableRow[]) => {
    const custom = targets.filter((row) => row.source === "custom");
    if (custom.length === 0) {
      return;
    }
    setPendingDelete(custom);
    setDeleteOpen(true);
  }, []);

  const columns = useMemo<TableColumn<GeoPromptTableRow>[]>(
    () => [
      {
        key: "prompt",
        header: (
          <span className="inline-flex items-center gap-1.5">
            Prompt
            <span className="font-normal text-muted-foreground tabular-nums">
              ({rows.length})
            </span>
          </span>
        ),
        sortable: true,
        width: "2.4fr",
        cell: (row) => (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block w-full min-w-0 truncate font-medium">
                  {row.prompt}
                </span>
              }
            />
            <TooltipContent className="max-w-sm">{row.prompt}</TooltipContent>
          </Tooltip>
        ),
      },
      {
        key: "source",
        header: "Source",
        width: "6.5rem",
        sortable: true,
        cell: (row) => (
          <Badge variant={row.source === "auto" ? "outline" : "secondary"}>
            {formatPromptSource(row.source)}
          </Badge>
        ),
      },
      {
        key: "presence",
        header: "Presence",
        width: "9.375rem",
        sortable: true,
        cell: (row) =>
          row.presence ? (
            <PresenceBadge status={row.presence} />
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        sortValue: (row) => promptPresenceSortValue(row.presence),
      },
      {
        key: "engines",
        header: "Engines",
        width: "8rem",
        align: "right",
        sortable: true,
        cell: (row) =>
          row.total === 0 ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <span className="text-muted-foreground tabular-nums">
              {row.mentioned}/{row.total}
            </span>
          ),
        sortValue: (row) => (row.total === 0 ? -1 : row.mentioned / row.total),
      },
      {
        key: "bestPosition",
        header: "Best",
        width: "6.5rem",
        align: "right",
        sortable: true,
        cell: (row) =>
          row.bestPosition === null ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <span className="tabular-nums">#{row.bestPosition}</span>
          ),
        sortValue: (row) => row.bestPosition ?? Number.MAX_SAFE_INTEGER,
      },
      {
        key: "enabled",
        header: "",
        width: "3.25rem",
        align: "right",
        cell: (row) =>
          row.source === "auto" ? null : (
            <Switch
              aria-label={
                row.enabled ? `Pause ${row.prompt}` : `Enable ${row.prompt}`
              }
              checked={row.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(enabled) =>
                toggle.mutate({ promptId: row.id, enabled })
              }
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              size="sm"
            />
          ),
      },
      {
        key: "actions",
        header: "",
        width: "3.25rem",
        align: "right",
        cell: (row) =>
          row.source === "auto" ? null : (
            <Button
              aria-label={`Remove ${row.prompt}`}
              disabled={remove.isPending}
              onClick={(event) => {
                event.stopPropagation();
                requestDelete([row]);
              }}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </Button>
          ),
      },
    ],
    [
      remove.isPending,
      requestDelete,
      rows.length,
      toggle.isPending,
      toggle.mutate,
    ]
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
            aria-label="Filter prompts"
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter prompts..."
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) =>
            setSourceFilter(toSourceFilter(value ?? "all"))
          }
          value={sourceFilter}
        >
          <SelectTrigger className="w-40 capitalize">
            <SelectValue>
              {PROMPT_SOURCE_FILTERS.find(
                (option) => option.value === sourceFilter
              )?.label ?? "All sources"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-64">
            {PROMPT_SOURCE_FILTERS.map((option) => (
              <SelectItem
                className="items-start py-1.5"
                key={option.value}
                value={option.value}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{option.label}</span>
                  <span className="whitespace-normal text-muted-foreground text-xs">
                    {option.description}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCustomRows.length > 0 && (
          <Button
            disabled={remove.isPending}
            onClick={() => requestDelete(selectedCustomRows)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            Remove ({selectedCustomRows.length})
          </Button>
        )}
      </div>

      <Table
        className="rounded-2xl"
        columns={columns}
        data={rows}
        defaultSort={{ key: "presence", direction: "desc" }}
        emptyState={
          prompts.length === 0
            ? geoScanEmptyMessage(
                isScanning,
                "Add a prompt to start tracking how AI engines answer"
              )
            : "No prompts match these filters"
        }
        getRowId={(row) => row.id}
        height={PROMPTS_TABLE_HEIGHT}
        onRowClick={setDetail}
        onSelectionChange={setSelectedIds}
        resizable
        rowHeight={PROMPTS_TABLE_ROW_HEIGHT}
        selectable
        selectedRowIds={selectedIds}
      />

      <GeoRemoveDialog
        description={promptRemoveDescription}
        isPending={remove.isPending}
        items={pendingDelete.map((row) => row.prompt)}
        nouns={PROMPT_NOUNS}
        onConfirm={() => {
          for (const row of pendingDelete) {
            remove.mutate({ promptId: row.id });
          }
          setSelectedIds([]);
          setDeleteOpen(false);
        }}
        onOpenChange={(openDialog) => {
          setDeleteOpen(openDialog);
          if (!openDialog) {
            setPendingDelete([]);
          }
        }}
        open={deleteOpen}
      />
      <PromptDetailDialog
        isScanning={isScanning}
        onOpenChange={(openDialog) => {
          if (!openDialog) {
            setDetail(null);
          }
        }}
        open={detail !== null}
        row={detail}
      />
    </div>
  );
}
