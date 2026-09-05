"use client";

import {
  Delete02Icon,
  SearchIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_PRESENCE_LABELS,
  GEO_PROMPT_AUTO_MANAGED_HINT,
  GEO_PROMPT_AUTO_MANAGED_LABEL,
  GEO_PROMPT_INTENT_LABELS,
  GEO_PROMPT_TAGS_CUSTOM_ONLY_TOAST,
  PROMPTS_TABLE_HEIGHT,
  PROMPTS_TABLE_ROW_HEIGHT,
} from "@notra/geo-core/constants/geo";
import type { GeoPresenceStatus } from "@notra/geo-core/types/geo";
import { collectPromptTags } from "@notra/geo-core/utils/geo-prompt-tags";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { TruncateWithTooltip } from "@notra/ui/components/shared/truncate-with-tooltip";
import { Badge } from "@notra/ui/components/ui/badge";
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
import { toast } from "sonner";

import { Button } from "@/components/button";
import { GeoRemoveDialog } from "@/components/geo/geo-remove-dialog";
import { PromptDetailDialog } from "@/components/geo/prompt-detail-dialog";
import { PromptSavedViewsMenu } from "@/components/geo/prompt-saved-views-menu";
import { PromptTagsDialog } from "@/components/geo/prompt-tags-dialog";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_PROMPT_DETAIL_SURFACES } from "@/constants/geo-analytics";
import {
  GEO_PROMPT_DEFAULT_FILTERS,
  GEO_PROMPT_FILTER_ALL,
  GEO_PROMPT_FILTER_SELECT_CLASS,
  GEO_PROMPT_INTENT_FILTER_OPTIONS,
  GEO_PROMPT_INTENT_FILTER_VALUES,
  GEO_PROMPT_SOURCE_FILTER_OPTIONS,
  GEO_PROMPT_SOURCE_FILTER_VALUES,
  GEO_PROMPT_TAG_FILTER_ALL_LABEL,
  GEO_PROMPT_TAGS_COPY,
  GEO_PROMPT_TAGS_VISIBLE_COUNT,
  GEO_PROMPT_VIEWS_COPY,
} from "@/constants/geo-prompts";
import { useGeoPromptsDb } from "@/lib/hooks/use-geo-db";
import { useGeoSavedViews } from "@/lib/hooks/use-geo-saved-views";
import type {
  GeoPromptSavedView,
  GeoPromptTableFilters,
  GeoPromptTableRow,
  PromptTagChipsProps,
  PromptTagsDialogTarget,
  PromptsTableProps,
} from "@/types/geo";
import { promptFiltersActive } from "@/utils/geo-prompt-views";
import {
  buildPromptTableRows,
  promptPresenceSortValue,
} from "@/utils/geo-prompts";

const PROMPT_NOUNS = { singular: "prompt", plural: "prompts" } as const;
const PROMPT_ACTIONS_WIDTH = "13rem";
const PRESENCE_TITLES: Record<GeoPresenceStatus, string> = {
  "training-data": "Named in the model, not only in live search",
  "retrieval-only": "Mentioned in Search only: found live, not in the model",
  invisible: "No engine mentions you on this prompt yet",
};

function PromptPresenceCell({ status }: { status: GeoPresenceStatus | null }) {
  if (!status) {
    return <span className="text-muted-foreground">-</span>;
  }
  const label = GEO_PRESENCE_LABELS[status];
  if (!label) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="text-muted-foreground" title={PRESENCE_TITLES[status]}>
      {label}
    </span>
  );
}

function PromptTagChips({ tags }: PromptTagChipsProps) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const visible = tags.slice(0, GEO_PROMPT_TAGS_VISIBLE_COUNT);
  const hidden = tags.length - visible.length;
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      {visible.map((tag) => (
        <Badge className="max-w-24 shrink" key={tag} variant="outline">
          <span className="truncate">{tag}</span>
        </Badge>
      ))}
      {hidden > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge className="text-muted-foreground" variant="outline">
                +{hidden}
              </Badge>
            }
          />
          <TooltipContent>
            {tags.slice(visible.length).join(", ")}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

function PromptRowActions({
  row,
  isPending,
  onToggle,
  onEditTags,
  onDelete,
}: {
  row: GeoPromptTableRow;
  isPending: boolean;
  onToggle: (enabled: boolean) => void;
  onEditTags: () => void;
  onDelete: () => void;
}) {
  const stop = (event: { stopPropagation: () => void }) =>
    event.stopPropagation();
  const pauseSwitch = (
    <Switch
      aria-label={row.enabled ? `Pause ${row.prompt}` : `Enable ${row.prompt}`}
      checked={row.enabled}
      disabled={isPending}
      onCheckedChange={onToggle}
      onClick={stop}
      onPointerDown={stop}
      size="sm"
    />
  );

  if (row.source === "auto") {
    return (
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                className="text-muted-foreground cursor-help font-normal"
                onClick={stop}
                onPointerDown={stop}
                variant="secondary"
              >
                {GEO_PROMPT_AUTO_MANAGED_LABEL}
              </Badge>
            }
          />
          <TooltipContent className="max-w-xs">
            {GEO_PROMPT_AUTO_MANAGED_HINT}
          </TooltipContent>
        </Tooltip>
        {pauseSwitch}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        aria-label={`${GEO_PROMPT_TAGS_COPY.edit}: ${row.prompt}`}
        disabled={isPending}
        onClick={(event) => {
          event.stopPropagation();
          onEditTags();
        }}
        size="icon"
        variant="ghost"
      >
        <HugeiconsIcon icon={Tag01Icon} size={14} />
      </Button>
      {pauseSwitch}
      <Button
        aria-label={`Remove ${row.prompt}`}
        disabled={isPending}
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
  const {
    pendingPromptIds,
    togglePrompt,
    removePrompts,
    setPromptTags,
    addTagsToPrompts,
  } = useGeoPromptsDb(organizationId);
  const { views, saveView, removeView } = useGeoSavedViews(organizationId);
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true })
  );
  const [intent, setIntent] = useQueryState(
    "intent",
    parseAsStringLiteral(GEO_PROMPT_INTENT_FILTER_VALUES)
      .withDefault(GEO_PROMPT_FILTER_ALL)
      .withOptions({ clearOnDefault: true })
  );
  const [tag, setTag] = useQueryState(
    "tag",
    parseAsString
      .withDefault(GEO_PROMPT_FILTER_ALL)
      .withOptions({ clearOnDefault: true })
  );
  const [source, setSource] = useQueryState(
    "source",
    parseAsStringLiteral(GEO_PROMPT_SOURCE_FILTER_VALUES)
      .withDefault(GEO_PROMPT_FILTER_ALL)
      .withOptions({ clearOnDefault: true })
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GeoPromptTableRow[]>([]);
  const [tagsTarget, setTagsTarget] = useState<PromptTagsDialogTarget | null>(
    null
  );
  const [detail, setDetail] = useState<GeoPromptTableRow | null>(null);

  const filters = useMemo<GeoPromptTableFilters>(
    () => ({ q: search, intent, tag, source }),
    [search, intent, tag, source]
  );
  const tagsInUse = useMemo(() => collectPromptTags(prompts), [prompts]);
  const activeTagFilterMissing =
    tag !== GEO_PROMPT_FILTER_ALL && !tagsInUse.includes(tag);
  const tagOptions = activeTagFilterMissing ? [tag, ...tagsInUse] : tagsInUse;

  const rows = useMemo(
    () => buildPromptTableRows(prompts, results, filters),
    [prompts, results, filters]
  );

  const selectedIdSet = new Set(selectedIds);
  const selectedRows = rows.filter((row) => selectedIdSet.has(row.id));
  const selectedCustomRows = selectedRows.filter(
    (row) => row.source === "custom"
  );

  const requestDelete = useCallback((targets: GeoPromptTableRow[]) => {
    const custom = targets.filter((row) => row.source === "custom");
    if (custom.length === 0) {
      return;
    }
    setPendingDelete(custom);
    setDeleteOpen(true);
  }, []);

  const applyView = (view: GeoPromptSavedView) => {
    setSearch(view.query.q);
    setIntent(view.query.intent);
    setTag(view.query.tag);
    setSource(view.query.source);
    toast.success(`${GEO_PROMPT_VIEWS_COPY.applied}: ${view.name}`);
  };

  const applyTags = (tags: string[]) => {
    if (!tagsTarget) {
      return;
    }
    if (tagsTarget.mode === "edit") {
      const target = tagsTarget.rows[0];
      if (target) {
        setPromptTags(target.id, tags);
      }
      return;
    }
    const custom = tagsTarget.rows.filter((row) => row.source === "custom");
    if (custom.length < tagsTarget.rows.length) {
      toast.info(GEO_PROMPT_TAGS_CUSTOM_ONLY_TOAST);
    }
    if (custom.length > 0 && tags.length > 0) {
      addTagsToPrompts(
        custom.map((row) => row.id),
        tags
      );
    }
  };

  const columns: TableColumn<GeoPromptTableRow>[] = [
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
      key: "intent",
      header: GEO_PROMPT_TAGS_COPY.intentColumn,
      width: "7.5rem",
      minWidth: "7.5rem",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {GEO_PROMPT_INTENT_LABELS[row.intent]}
        </span>
      ),
      sortValue: (row) => GEO_PROMPT_INTENT_LABELS[row.intent],
    },
    {
      key: "tags",
      header: GEO_PROMPT_TAGS_COPY.column,
      width: "8rem",
      minWidth: "7rem",
      sortable: true,
      cell: (row) => <PromptTagChips tags={row.tags} />,
      sortValue: (row) => row.tags.join(" "),
    },
    {
      key: "presence",
      header: "Presence",
      width: "7.5rem",
      minWidth: "7.5rem",
      sortable: true,
      cell: (row) => <PromptPresenceCell status={row.presence} />,
      sortValue: (row) => promptPresenceSortValue(row.presence),
    },
    {
      key: "engines",
      header: "Engines",
      width: "5.5rem",
      minWidth: "5.5rem",
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
      width: "4.5rem",
      minWidth: "4.5rem",
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
          isPending={pendingPromptIds.has(row.id)}
          onDelete={() => requestDelete([row])}
          onEditTags={() => setTagsTarget({ mode: "edit", rows: [row] })}
          onToggle={(enabled) => togglePrompt(row.id, enabled)}
          row={row}
        />
      ),
    },
  ];

  const tagsDialogTarget = tagsTarget?.rows[0] ?? null;
  const tagsDialogIsEdit = tagsTarget?.mode === "edit";

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
        <Select
          onValueChange={(value) => {
            const next = GEO_PROMPT_INTENT_FILTER_VALUES.find(
              (option) => option === value
            );
            setIntent(next ?? GEO_PROMPT_FILTER_ALL);
          }}
          value={intent}
        >
          <SelectTrigger
            aria-label="Filter by intent"
            className={GEO_PROMPT_FILTER_SELECT_CLASS}
          >
            <SelectValue>
              {GEO_PROMPT_INTENT_FILTER_OPTIONS.find(
                (option) => option.value === intent
              )?.label ?? GEO_PROMPT_INTENT_FILTER_OPTIONS[0]?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GEO_PROMPT_INTENT_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tagOptions.length > 0 ? (
          <Select
            onValueChange={(value) => setTag(value ?? GEO_PROMPT_FILTER_ALL)}
            value={tag}
          >
            <SelectTrigger
              aria-label="Filter by tag"
              className={GEO_PROMPT_FILTER_SELECT_CLASS}
            >
              <SelectValue>
                {tag === GEO_PROMPT_FILTER_ALL
                  ? GEO_PROMPT_TAG_FILTER_ALL_LABEL
                  : tag}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GEO_PROMPT_FILTER_ALL}>
                {GEO_PROMPT_TAG_FILTER_ALL_LABEL}
              </SelectItem>
              {tagOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select
          onValueChange={(value) => {
            const next = GEO_PROMPT_SOURCE_FILTER_VALUES.find(
              (option) => option === value
            );
            setSource(next ?? GEO_PROMPT_FILTER_ALL);
          }}
          value={source}
        >
          <SelectTrigger
            aria-label="Filter by source"
            className={GEO_PROMPT_FILTER_SELECT_CLASS}
          >
            <SelectValue>
              {GEO_PROMPT_SOURCE_FILTER_OPTIONS.find(
                (option) => option.value === source
              )?.label ?? GEO_PROMPT_SOURCE_FILTER_OPTIONS[0]?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GEO_PROMPT_SOURCE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PromptSavedViewsMenu
          filters={filters}
          onApply={applyView}
          onRemove={(viewId) => {
            removeView(viewId);
            toast.success(GEO_PROMPT_VIEWS_COPY.removedToast);
          }}
          onSave={(name) => {
            saveView(name, filters);
            toast.success(GEO_PROMPT_VIEWS_COPY.savedToast);
          }}
          views={views}
        />
        {promptFiltersActive(filters) ? (
          <Button
            onClick={() => {
              setSearch(GEO_PROMPT_DEFAULT_FILTERS.q);
              setIntent(GEO_PROMPT_DEFAULT_FILTERS.intent);
              setTag(GEO_PROMPT_DEFAULT_FILTERS.tag);
              setSource(GEO_PROMPT_DEFAULT_FILTERS.source);
            }}
            size="sm"
            variant="ghost"
          >
            Clear
          </Button>
        ) : null}
        {selectedRows.length > 0 && (
          <Button
            onClick={() => setTagsTarget({ mode: "bulk", rows: selectedRows })}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Tag01Icon} size={14} />
            {GEO_PROMPT_TAGS_COPY.bulk} ({selectedRows.length})
          </Button>
        )}
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
      <PromptTagsDialog
        confirmLabel={
          tagsDialogIsEdit
            ? GEO_PROMPT_TAGS_COPY.confirm
            : GEO_PROMPT_TAGS_COPY.bulkConfirm
        }
        description={
          tagsDialogIsEdit
            ? GEO_PROMPT_TAGS_COPY.editDescription
            : GEO_PROMPT_TAGS_COPY.bulkDescription
        }
        initialTags={tagsDialogIsEdit ? (tagsDialogTarget?.tags ?? []) : []}
        onConfirm={applyTags}
        onOpenChange={(openDialog) => {
          if (!openDialog) {
            setTagsTarget(null);
          }
        }}
        open={tagsTarget !== null}
        suggestions={tagsInUse}
        title={
          tagsDialogIsEdit
            ? GEO_PROMPT_TAGS_COPY.edit
            : GEO_PROMPT_TAGS_COPY.bulkTitle
        }
      />
      <PromptDetailDialog
        isScanning={isScanning}
        onOpenChange={(openDialog) => {
          if (!openDialog) {
            setDetail(null);
          }
        }}
        open={detail !== null}
        organizationId={organizationId}
        row={detail}
        surface={GEO_PROMPT_DETAIL_SURFACES.PROMPTS_TABLE}
      />
    </div>
  );
}
