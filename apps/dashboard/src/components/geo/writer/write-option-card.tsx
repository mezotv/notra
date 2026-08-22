"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import type { WriteOptionCardProps } from "@/types/components/geo-writer";

function SelectionBox({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
      )}
    >
      {selected && (
        <HugeiconsIcon className="size-3" icon={Tick01Icon} strokeWidth={3} />
      )}
    </div>
  );
}

export function WriteOptionCard({
  icon,
  label,
  description,
  selected,
  onToggle,
  compact = false,
}: WriteOptionCardProps) {
  const shellClassName = cn(
    "group relative flex cursor-pointer rounded-lg border bg-card text-left transition-colors",
    "hover:border-foreground/20",
    selected ? "border-foreground/40 bg-foreground/[0.02]" : "border-border",
    compact ? "items-center gap-2.5 px-3 py-2" : "flex-col gap-3 p-4"
  );

  if (compact) {
    return (
      <button
        aria-pressed={selected}
        className={shellClassName}
        onClick={onToggle}
        type="button"
      >
        {icon}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm leading-tight">{label}</p>
          {description ? (
            <p className="truncate text-muted-foreground text-xs">
              {description}
            </p>
          ) : null}
        </div>
        <SelectionBox selected={selected} />
      </button>
    );
  }

  return (
    <button
      aria-pressed={selected}
      className={shellClassName}
      onClick={onToggle}
      type="button"
    >
      <div className="flex items-start justify-between">
        {icon}
        <SelectionBox selected={selected} />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-sm">{label}</p>
        {description ? (
          <p className="truncate text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
