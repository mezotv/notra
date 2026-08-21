"use client";

import { ArrowDown01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/calendar";
import { GEO_FILTER_TRIGGER_CLASS, GEO_RANGE_PRESETS } from "@/constants/geo";
import type { GeoRangePickerProps } from "@/types/geo";
import {
  geoCalendarDefaultMonth,
  localDayString,
  parseLocalDay,
} from "@/utils/geo-range";

export function GeoRangePicker({ control }: GeoRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  const selected =
    draft ??
    (control.preset === "custom"
      ? {
          from: parseLocalDay(control.range.dateFrom),
          to: parseLocalDay(control.range.dateTo),
        }
      : undefined);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDraft(undefined);
    }
    setOpen(next);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        aria-label="Date range"
        className={GEO_FILTER_TRIGGER_CLASS}
      >
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={Calendar03Icon}
          size={12}
        />
        <span className="tabular-nums">{control.label}</span>
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={ArrowDown01Icon}
          size={12}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          <div className="flex flex-col gap-1 border-border border-r p-2">
            {GEO_RANGE_PRESETS.map((preset) => (
              <Button
                className="justify-start"
                key={preset.value}
                onClick={() => {
                  control.setPreset(preset.value);
                  handleOpenChange(false);
                }}
                size="sm"
                variant={
                  control.preset === preset.value ? "secondary" : "ghost"
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            defaultMonth={geoCalendarDefaultMonth(selected?.from)}
            disabled={{ after: new Date() }}
            mode="range"
            numberOfMonths={2}
            onSelect={(next) => {
              setDraft(next);
              if (next?.from && next.to) {
                control.setCustom({
                  dateFrom: localDayString(next.from),
                  dateTo: localDayString(next.to),
                });
              }
            }}
            selected={selected}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
