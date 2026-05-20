"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { FORMAT_ORDER } from "@/constants/content-formats";
import { LOOKBACK_WINDOWS, type LookbackWindow } from "@/schemas/integrations";
import type { FormatsStepProps } from "@/types/content/create";
import { formatSnakeCaseLabel } from "@/utils/format";
import { DataPointToggle } from "./data-point-toggle";
import { FormatCard } from "./format-card";

export function StepFormats({
  selected,
  onToggle,
  lookbackWindow,
  onLookbackChange,
  dataPoints,
  onDataPointChange,
}: FormatsStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl tracking-tight">
          What do you want to create?
        </h2>
        <p className="text-muted-foreground text-sm">
          Select one or more content formats. We'll help you craft each one.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {FORMAT_ORDER.map((format) => (
          <FormatCard
            format={format}
            key={format}
            onToggle={() => onToggle(format)}
            selected={selected.includes(format)}
          />
        ))}
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-sm">Timeframe</p>
            <p className="text-muted-foreground text-xs">
              How far back to look when gathering activity data.
            </p>
          </div>
          <Select
            onValueChange={(v) => {
              if (v) {
                onLookbackChange(v as LookbackWindow);
              }
            }}
            value={lookbackWindow}
          >
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Select timeframe">
                <span className="capitalize">
                  {formatSnakeCaseLabel(lookbackWindow)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LOOKBACK_WINDOWS.map((w) => (
                <SelectItem key={w} value={w}>
                  <span className="capitalize">{formatSnakeCaseLabel(w)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <DataPointToggle
            checked={dataPoints.includePullRequests}
            description="Merged PR metadata"
            label="Pull Requests"
            onCheckedChange={(v) => onDataPointChange("includePullRequests", v)}
          />
          <DataPointToggle
            checked={dataPoints.includeCommits}
            description="Commit-level changes"
            label="Commits"
            onCheckedChange={(v) => onDataPointChange("includeCommits", v)}
          />
          <DataPointToggle
            checked={dataPoints.includeReleases}
            description="GitHub releases"
            label="Releases"
            onCheckedChange={(v) => onDataPointChange("includeReleases", v)}
          />
        </div>
      </div>
    </div>
  );
}
