"use client";

import {
  Alert02Icon,
  Csv01Icon,
  Download01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dropzone } from "@notra/ui/components/kibo-ui/dropzone";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Effect } from "effect";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { StatusSpinner } from "@/components/geo/status-spinner";
import {
  GEO_CSV_IMPORT_ACCEPT,
  GEO_CSV_IMPORT_MAX_BYTES,
  GEO_CSV_IMPORT_MAX_ISSUES_SHOWN,
  GEO_IMPORT_COPY,
} from "@/constants/geo-import";
import {
  parseCompetitorsCsv,
  parsePromptsCsv,
  readGeoCsvFile,
} from "@/lib/geo/csv-import";
import {
  useGeoImportCompetitors,
  useGeoImportPrompts,
} from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type {
  GeoCsvImportDialogProps,
  GeoCsvIssue,
  GeoCsvSelection,
  GeoImportDialogProps,
} from "@/types/geo-import";
import { downloadBlob } from "@/utils/download";
import { formatCsvFileSize, geoImportNoun } from "@/utils/geo-import";

function CsvIssueList({ issues }: { issues: GeoCsvIssue[] }) {
  const visible = issues.slice(0, GEO_CSV_IMPORT_MAX_ISSUES_SHOWN);
  const hidden = issues.length - visible.length;
  return (
    <ul className="space-y-1 text-xs">
      {visible.map((issue) => (
        <li
          className="text-muted-foreground flex gap-2"
          key={`${issue.line}:${issue.message}`}
        >
          <span className="shrink-0 tabular-nums">Line {issue.line}</span>
          <span className="text-foreground">{issue.message}</span>
        </li>
      ))}
      {hidden > 0 ? (
        <li className="text-muted-foreground">and {hidden} more</li>
      ) : null}
    </ul>
  );
}

function CsvSummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning";
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {tone === "warning" ? (
          <HugeiconsIcon
            className="size-3.5 text-amber-600 dark:text-amber-400"
            icon={Alert02Icon}
          />
        ) : null}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function GeoCsvImportDialog<TRow>({
  open,
  onOpenChange,
  kind,
  parse,
  onImport,
  isPending,
}: GeoCsvImportDialogProps<TRow>) {
  const [selection, setSelection] = useState<GeoCsvSelection<TRow> | null>(
    null
  );
  const copy = GEO_IMPORT_COPY[kind];
  const rows = selection?.result.rows ?? [];
  const issues = selection?.result.issues ?? [];
  const duplicates = selection?.result.duplicates ?? 0;
  const canImport = rows.length > 0 && !isPending;

  const close = () => {
    setSelection(null);
    onOpenChange(false);
  };

  const handleDrop = (files: File[]) => {
    const file = files.at(0);
    if (!file) {
      return;
    }
    Effect.runFork(
      readGeoCsvFile(file, parse).pipe(
        Effect.match({
          onSuccess: setSelection,
          onFailure: () => toast.error("Could not read that file"),
        })
      )
    );
  };

  const handleImport = () => {
    if (!canImport) {
      return;
    }
    Effect.runFork(
      Effect.tryPromise(() => onImport(rows)).pipe(
        Effect.match({
          onSuccess: close,
          onFailure: () => undefined,
        })
      )
    );
  };

  const downloadTemplate = () => {
    downloadBlob(
      new Blob([copy.template], { type: "text/csv;charset=utf-8" }),
      copy.templateFilename
    );
  };

  return (
    <ResponsiveDialog
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        close();
      }}
      open={open}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{copy.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {copy.description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-3 px-4 md:px-0">
          <Dropzone
            accept={GEO_CSV_IMPORT_ACCEPT}
            className={cn(
              "border-dashed p-6 transition-colors",
              selection && "border-solid"
            )}
            disabled={isPending}
            maxFiles={1}
            maxSize={GEO_CSV_IMPORT_MAX_BYTES}
            onDrop={handleDrop}
            onError={(error) => toast.error(error.message)}
            src={selection ? [selection.file] : undefined}
          >
            {selection ? (
              <div className="flex w-full items-center gap-3 text-left">
                <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <HugeiconsIcon className="size-4" icon={Csv01Icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selection.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatCsvFileSize(selection.file.size)} · Drop another file
                    to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                  <HugeiconsIcon className="size-4" icon={Upload01Icon} />
                </div>
                <p className="text-sm font-medium">Drop your CSV here</p>
                <p className="text-muted-foreground text-xs">
                  or click to browse · up to{" "}
                  {formatCsvFileSize(GEO_CSV_IMPORT_MAX_BYTES)}
                </p>
              </div>
            )}
          </Dropzone>
          {selection ? (
            <div className="divide-y rounded-lg border text-sm">
              <CsvSummaryRow label="Ready to import" value={rows.length} />
              {duplicates > 0 ? (
                <CsvSummaryRow label="Duplicates skipped" value={duplicates} />
              ) : null}
              {issues.length > 0 ? (
                <div className="space-y-2 pb-3">
                  <CsvSummaryRow
                    label="Rows with problems"
                    tone="warning"
                    value={issues.length}
                  />
                  <div className="px-3">
                    <CsvIssueList issues={issues} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button
              className="h-auto shrink-0 gap-1 px-0 text-xs"
              onClick={downloadTemplate}
              size="xs"
              type="button"
              variant="link"
            >
              <HugeiconsIcon className="size-3" icon={Download01Icon} />
              Download template
            </Button>
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button
            disabled={isPending}
            onClick={close}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={!canImport} onClick={handleImport} type="button">
            {isPending ? <StatusSpinner /> : null}
            {rows.length > 0
              ? `Import ${rows.length} ${geoImportNoun(kind, rows.length)}`
              : `Import ${copy.nounPlural}`}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function PromptsCsvImportDialog({
  open,
  onOpenChange,
  organizationId,
}: GeoImportDialogProps) {
  const importPrompts = useGeoImportPrompts(organizationId);
  return (
    <GeoCsvImportDialog
      isPending={importPrompts.isPending}
      kind="prompts"
      onImport={(rows) => importPrompts.mutateAsync(rows)}
      onOpenChange={onOpenChange}
      open={open}
      parse={parsePromptsCsv}
    />
  );
}

export function CompetitorsCsvImportDialog({
  open,
  onOpenChange,
  organizationId,
}: GeoImportDialogProps) {
  const importCompetitors = useGeoImportCompetitors(organizationId);
  return (
    <GeoCsvImportDialog
      isPending={importCompetitors.isPending}
      kind="competitors"
      onImport={(rows) => importCompetitors.mutateAsync(rows)}
      onOpenChange={onOpenChange}
      open={open}
      parse={parseCompetitorsCsv}
    />
  );
}
