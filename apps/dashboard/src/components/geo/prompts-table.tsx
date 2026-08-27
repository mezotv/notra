"use client";

import { Delete02Icon, SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { GeoRemoveDialog } from "@/components/geo/geo-remove-dialog";
import { PresenceBadge } from "@/components/geo/presence-badge";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import {
  PROMPTS_TABLE_HEIGHT,
  PROMPTS_TABLE_ROW_HEIGHT,
} from "@/constants/geo";
import { useGeoPromptsDb } from "@/lib/hooks/use-geo-db";
import type { GeoPromptTableRow, PromptsTableProps } from "@/types/geo";
import {
  buildPromptTableRows,
  promptPresenceSortValue,
} from "@/utils/geo-prompts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

const PROMPT_NOUNS = { singular: "prompt", plural: "prompts" } as const;
const PROMPT_ACTIONS_WIDTH = "6.5rem";

function PromptRowActions({
  row,
  isToggling,
  isRemoving,
  onToggle,
  onDelete,
}: {
  row: GeoPromptTableRow;
  isToggling: boolean;
  isRemoving: boolean;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  if (row.source === "auto") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-label="Auto-generated prompts cannot be paused or removed"
              className="text-muted-foreground inline-flex size-8 cursor-help items-center justify-center"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              —
            </button>
          }
        />
        <TooltipContent className="max-w-xs">
          Generated from your site. Only custom prompts can be paused or
          removed.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Switch
        aria-label={
          row.enabled ? `Pause ${row.prompt}` : `Enable ${row.prompt}`
        }
        checked={row.enabled}
        disabled={isToggling}
        onCheckedChange={onToggle}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        size="sm"
      />
      <Button
        aria-label={`Remove ${row.prompt}`}
        disabled={isRemoving}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        size="icon"
        variant="ghost"
      >
        <HugeiconsIcon icon={Delete02Icon} size={14} />
      </Button>
    </div>
  );
}

function promptRemoveDescription(items: string[]): string {
  if (items.length > 1) {
    return "These questions will no longer be asked in GEO scans. Historical answers stay in your results.";
  }
  return `"${items[0]}" will no longer be asked in GEO scans. Historical answers stay in your results.`;
}

export function PromptsTable({
  organizationId,
  prompts,
  results,
  isScanning = false,
}: PromptsTableProps) {
  const { pendingPromptIds, togglePrompt, removePrompts } =
    useGeoPromptsDb(organizationId);
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GeoPromptTableRow[]>([]);
  const [detail, setDetail] = useState<GeoPromptTableRow | null>(null);

  const rows = useMemo(
    () => buildPromptTableRows(prompts, results, search),
    [prompts, results, search]
  );

  const selectedCustomRows = useMemo(() => {
    const selectedIdSet = new Set(selectedIds);
    return rows.filter(
      (row) => row.source === "custom" && selectedIdSet.has(row.id)
    );
  }, [rows, selectedIds]);

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
            <span className="text-muted-foreground font-normal tabular-nums">
              ({rows.length})
            </span>
          </span>
        ),
        sortable: true,
        width: "1fr",
        minWidth: "10rem",
        cell: (row) => (
          <TruncateWithTooltip className="font-medium">
            {row.prompt}
          </TruncateWithTooltip>
        ),
      },
      {
        key: "presence",
        header: "Presence",
        width: "8.5rem",
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
        width: "7rem",
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
        width: "5.5rem",
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
        key: "actions",
        header: "",
        width: PROMPT_ACTIONS_WIDTH,
        minWidth: PROMPT_ACTIONS_WIDTH,
        align: "right",
        cell: (row) => (
          <PromptRowActions
            isRemoving={pendingPromptIds.has(row.id)}
            isToggling={pendingPromptIds.has(row.id)}
            onDelete={() => requestDelete([row])}
            onToggle={(enabled) => togglePrompt(row.id, enabled)}
            row={row}
          />
        ),
      },
    ],
    [pendingPromptIds, requestDelete, rows.length, togglePrompt]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <HugeiconsIcon
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
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
        {selectedCustomRows.length > 0 && (
          <Button
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
        isPending={false}
        items={pendingDelete.map((row) => row.prompt)}
        nouns={PROMPT_NOUNS}
        onConfirm={() => {
          removePrompts(pendingDelete.map((row) => row.id));
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
