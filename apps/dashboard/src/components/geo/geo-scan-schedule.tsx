"use client";

import {
  GEO_SCAN_DEFAULT_INTERVAL_HOURS,
  GEO_SCAN_INTERVAL_OPTIONS,
} from "@notra/geo-core/constants/geo";
import { geoScanIntervalNoun } from "@notra/geo-core/utils/geo-scan";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";

import { cn } from "@/lib/utils";
import type { GeoScanScheduleProps } from "@/types/geo";

export function GeoScanSchedule({
  id,
  enabled,
  onEnabledChange,
  intervalHours,
  onIntervalChange,
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
    <div className="ring-foreground/10 divide-y rounded-lg ring-1">
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
      <div
        className={cn(
          "space-y-2 px-3 py-2.5 transition-opacity",
          !enabled && "opacity-50"
        )}
      >
        <fieldset className="space-y-2" disabled={!enabled}>
          <legend className="space-y-0.5">
            <span className="text-sm font-medium">Frequency</span>
            <p className="text-muted-foreground text-xs">
              How often every enabled model is checked.
            </p>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {GEO_SCAN_INTERVAL_OPTIONS.map((option) => {
              const selected = option.value === intervalHours;
              const isDefault =
                option.value === GEO_SCAN_DEFAULT_INTERVAL_HOURS;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm font-medium ring-1 transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-background text-muted-foreground ring-foreground/10 hover:text-foreground",
                    "disabled:cursor-not-allowed"
                  )}
                  key={option.value}
                  onClick={() => onIntervalChange(option.value)}
                  title={option.label}
                  type="button"
                >
                  {option.short}
                  {isDefault ? (
                    <span
                      className={cn(
                        "text-xs",
                        selected
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/70"
                      )}
                    >
                      default
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
