"use client";

import {
  GEO_SCAN_DEFAULT_INTERVAL_HOURS,
  GEO_SCAN_INTERVAL_OPTIONS,
} from "@notra/geo-core/constants/geo";
import { geoScanIntervalNoun } from "@notra/geo-core/utils/geo-scan";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";

import type {
  GeoScanFrequencySelectProps,
  GeoScanScheduleProps,
} from "@/types/geo";

function intervalShortLabel(hours: number): string {
  return (
    GEO_SCAN_INTERVAL_OPTIONS.find((option) => option.value === hours)?.short ??
    geoScanIntervalNoun(hours)
  );
}

export function GeoScanFrequencySelect({
  id,
  intervalHours,
  onIntervalChange,
  disabled = false,
}: GeoScanFrequencySelectProps) {
  const triggerId = `${id}-frequency`;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Label className="text-muted-foreground font-normal" htmlFor={triggerId}>
        Set frequency
      </Label>
      <Select
        disabled={disabled}
        onValueChange={(value: string | null) => {
          if (value !== null) {
            onIntervalChange(Number(value));
          }
        }}
        value={String(intervalHours)}
      >
        <SelectTrigger aria-label="Scan frequency" id={triggerId} size="sm">
          <SelectValue>
            {(value: string) => intervalShortLabel(Number(value))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {GEO_SCAN_INTERVAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.short}
              {option.value === GEO_SCAN_DEFAULT_INTERVAL_HOURS ? (
                <span className="text-muted-foreground text-xs">default</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function GeoScanSchedule({
  id,
  enabled,
  onEnabledChange,
  intervalHours,
}: GeoScanScheduleProps) {
  const summary = enabled ? (
    <>
      Enabled models are checked every{" "}
      <strong className="text-foreground font-semibold">
        {geoScanIntervalNoun(intervalHours)}
      </strong>
      .
    </>
  ) : (
    "Automatic checks are paused. You can still run scans manually."
  );

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="space-y-0.5">
        <Label htmlFor={`${id}-enabled`}>Automatic scans</Label>
        <p className="text-muted-foreground text-xs">{summary}</p>
      </div>
      <Switch
        checked={enabled}
        id={`${id}-enabled`}
        onCheckedChange={onEnabledChange}
      />
    </div>
  );
}
