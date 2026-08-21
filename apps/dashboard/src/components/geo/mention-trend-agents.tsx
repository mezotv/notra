"use client";

import { ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  GEO_FILTER_TRIGGER_CLASS,
  GEO_MENTION_TREND_AGENT_ICON_LIMIT,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { MentionTrendAgentsPickerProps } from "@/types/geo";

export function MentionTrendAgentsPicker({
  series,
  hiddenKeys,
  onToggle,
  disabled = false,
}: MentionTrendAgentsPickerProps) {
  const visible = series.filter((entry) => !hiddenKeys.has(entry.key));
  const preview = visible.slice(0, GEO_MENTION_TREND_AGENT_ICON_LIMIT);
  const count = visible.length;
  const label = `${count} ${count === 1 ? "agent" : "agents"}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mention trend agents"
        className={cn(
          GEO_FILTER_TRIGGER_CLASS,
          disabled && "pointer-events-none opacity-50"
        )}
        disabled={disabled}
      >
        {preview.length > 0 ? (
          <span className="-space-x-1.5 flex items-center pr-0.5">
            {preview.map((entry) => (
              <span
                className="relative flex size-4 items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-background"
                key={entry.key}
              >
                <EngineIcon className="size-3.5" engine={entry.engine} />
              </span>
            ))}
          </span>
        ) : null}
        <span>{label}</span>
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={ArrowUpDownIcon}
          size={12}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {series.map((entry) => {
          const hidden = hiddenKeys.has(entry.key);
          return (
            <DropdownMenuCheckboxItem
              checked={!hidden}
              disabled={!hidden && visible.length <= 1}
              key={entry.key}
              onCheckedChange={() => onToggle(entry.key)}
            >
              <EngineIcon className="size-3.5" engine={entry.engine} />
              {entry.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
