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
          "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-input px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
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
            <span className="truncate font-medium text-sm">{name}</span>
            {domain ? (
              <span className="truncate text-muted-foreground text-xs">
                {domain}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="line-clamp-1 text-muted-foreground text-xs">
              {description}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border border-input text-muted-foreground transition-colors",
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
