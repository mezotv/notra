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
import {
  GEO_MENTION_TREND_RANGE_DAYS,
  GEO_MENTION_TREND_RANGES,
} from "@/constants/geo";
import type {
  GeoMentionTrendRange,
  MentionTrendRangePickerProps,
} from "@/types/geo";

export const MENTION_TREND_FILTER_TRIGGER_CLASS =
  "flex h-7 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring";

function isMentionTrendRange(value: string): value is GeoMentionTrendRange {
  return value in GEO_MENTION_TREND_RANGE_DAYS;
}

export function MentionTrendRangePicker({
  value,
  onChange,
}: MentionTrendRangePickerProps) {
  const selected =
    GEO_MENTION_TREND_RANGES.find((range) => range.value === value) ??
    GEO_MENTION_TREND_RANGES.at(-1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mention trend time range"
        className={MENTION_TREND_FILTER_TRIGGER_CLASS}
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
            if (isMentionTrendRange(next)) {
              onChange(next);
            }
          }}
          value={value}
        >
          {GEO_MENTION_TREND_RANGES.map((range) => (
            <DropdownMenuRadioItem key={range.value} value={range.value}>
              {range.description}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
