"use client";

import { PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CompetitorBrandLogo } from "@/components/onboarding/competitor-brand-logo";
import { cn } from "@/lib/utils";
import type { CompetitorChoiceRowProps } from "@/types/onboarding";

export function CompetitorChoiceRow({
  name,
  domain,
  description,
  selected,
  disabled,
  onToggle,
}: CompetitorChoiceRowProps) {
  return (
    <li>
      <button
        aria-pressed={selected}
        className={cn(
          "border-input hover:bg-muted/40 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          selected && "border-primary/40 bg-primary/5"
        )}
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        <CompetitorBrandLogo
          className="size-8 rounded-md"
          domain={domain}
          logo={null}
          name={name}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium">{name}</span>
            {domain ? (
              <span className="text-muted-foreground truncate text-xs">
                {domain}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="text-muted-foreground line-clamp-1 text-xs">
              {description}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "border-input text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected && "border-primary bg-primary text-primary-foreground"
          )}
        >
          <HugeiconsIcon
            icon={selected ? Tick02Icon : PlusSignIcon}
            size={14}
          />
        </span>
      </button>
    </li>
  );
}
