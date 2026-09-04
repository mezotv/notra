"use client";

import {
  GEO_SCAN_CUSTOM_INTERVAL_VALUE,
  GEO_SCAN_DEFAULT_INTERVAL_HOURS,
  GEO_SCAN_HOURS_PER_DAY,
  GEO_SCAN_INTERVAL_OPTIONS,
  GEO_SCAN_MAX_INTERVAL_DAYS,
  GEO_SCAN_MIN_INTERVAL_DAYS,
} from "@notra/geo-core/constants/geo";
import {
  geoScanIntervalDays,
  geoScanIntervalNoun,
  isGeoScanIntervalPreset,
} from "@notra/geo-core/utils/geo-scan";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";

import type {
  GeoScanFrequencySelectProps,
  GeoScanScheduleProps,
} from "@/types/geo";

function intervalShortLabel(value: string, intervalHours: number): string {
  if (value === GEO_SCAN_CUSTOM_INTERVAL_VALUE) {
    return "Custom";
  }
  return (
    GEO_SCAN_INTERVAL_OPTIONS.find((option) => option.value === intervalHours)
      ?.short ?? geoScanIntervalNoun(intervalHours)
  );
}

function parseIntervalDays(raw: string): number | null {
  const days = Number(raw);
  if (
    raw.trim() === "" ||
    !Number.isInteger(days) ||
    days < GEO_SCAN_MIN_INTERVAL_DAYS ||
    days > GEO_SCAN_MAX_INTERVAL_DAYS
  ) {
    return null;
  }
  return days;
}

export function GeoScanFrequencySelect({
  id,
  intervalHours,
  onIntervalChange,
  disabled = false,
}: GeoScanFrequencySelectProps) {
  const triggerId = `${id}-frequency`;
  const daysId = `${id}-interval-days`;
  const [isCustom, setIsCustom] = useState(
    () => !isGeoScanIntervalPreset(intervalHours)
  );
  const [daysDraft, setDaysDraft] = useState(() =>
    String(geoScanIntervalDays(intervalHours))
  );
  const selectValue = isCustom
    ? GEO_SCAN_CUSTOM_INTERVAL_VALUE
    : String(intervalHours);
  const daysInvalid = parseIntervalDays(daysDraft) === null;
  const isPlural = parseIntervalDays(daysDraft) !== 1;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Label className="text-muted-foreground font-normal" htmlFor={triggerId}>
        Set frequency
      </Label>
      <Select
        disabled={disabled}
        onValueChange={(value: string | null) => {
          if (value === null) {
            return;
          }
          if (value === GEO_SCAN_CUSTOM_INTERVAL_VALUE) {
            setIsCustom(true);
            setDaysDraft(String(geoScanIntervalDays(intervalHours)));
            return;
          }
          setIsCustom(false);
          onIntervalChange(Number(value));
        }}
        value={selectValue}
      >
        <SelectTrigger aria-label="Scan frequency" id={triggerId} size="sm">
          <SelectValue>
            {(value: string) => intervalShortLabel(value, intervalHours)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {GEO_SCAN_INTERVAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              <span className="flex items-baseline gap-2">
                {option.short}
                {option.value === GEO_SCAN_DEFAULT_INTERVAL_HOURS ? (
                  <span className="text-muted-foreground text-xs">default</span>
                ) : null}
              </span>
            </SelectItem>
          ))}
          <SelectItem value={GEO_SCAN_CUSTOM_INTERVAL_VALUE}>
            Custom…
          </SelectItem>
        </SelectContent>
      </Select>
      {isCustom ? (
        <div className="flex items-center gap-1.5">
          <Label className="sr-only" htmlFor={daysId}>
            Days between scans
          </Label>
          <span className="text-muted-foreground text-sm">every</span>
          <Input
            aria-invalid={daysInvalid || undefined}
            className="h-8 w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            disabled={disabled}
            id={daysId}
            inputMode="numeric"
            max={GEO_SCAN_MAX_INTERVAL_DAYS}
            min={GEO_SCAN_MIN_INTERVAL_DAYS}
            onChange={(event) => {
              const next = event.target.value;
              setDaysDraft(next);
              const days = parseIntervalDays(next);
              if (days !== null) {
                onIntervalChange(days * GEO_SCAN_HOURS_PER_DAY);
              }
            }}
            step={1}
            type="number"
            value={daysDraft}
          />
          <span className="text-muted-foreground text-sm">
            <span aria-hidden="true">
              day
              <span
                className={cn(
                  "inline-grid overflow-hidden transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none",
                  isPlural ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
                )}
              >
                <span className="overflow-hidden">s</span>
              </span>
            </span>
            <span className="sr-only">{isPlural ? "days" : "day"}</span>
          </span>
        </div>
      ) : null}
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
