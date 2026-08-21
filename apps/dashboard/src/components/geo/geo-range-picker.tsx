"use client";

import { ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { GEO_FILTER_TRIGGER_CLASS, GEO_RANGES } from "@/constants/geo";
import type { GeoRangePickerProps } from "@/types/geo";
import { isGeoRange } from "@/utils/geo-range";

export function GeoRangePicker({ value, onChange }: GeoRangePickerProps) {
  const selected =
    GEO_RANGES.find((range) => range.value === value) ?? GEO_RANGES.at(-1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Time range"
        className={GEO_FILTER_TRIGGER_CLASS}
      >
        <span className="tabular-nums">{selected?.label ?? value}</span>
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={ArrowUpDownIcon}
          size={12}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          onValueChange={(next) => {
            if (isGeoRange(next)) {
              onChange(next);
            }
          }}
          value={value}
        >
          {GEO_RANGES.map((range) => (
            <DropdownMenuRadioItem
              closeOnClick
              key={range.value}
              value={range.value}
            >
              {range.description}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
