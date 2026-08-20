"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@notra/ui/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/button";
import { addUniqueValues, removeValue } from "@/lib/geo/string-list";
import { cn } from "@/lib/utils";
import type { GeoTagListProps } from "@/types/geo";

export function GeoTagList({
  id,
  label,
  description,
  values,
  onChange,
  placeholder,
  max,
  disabled = false,
}: GeoTagListProps) {
  const [draft, setDraft] = useState("");
  const atLimit = values.length >= max;

  const commitDraft = () => {
    if (atLimit) {
      setDraft("");
      return;
    }
    const next = addUniqueValues(values, draft, max);
    if (next !== values) {
      onChange(next);
    }
    setDraft("");
  };

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="space-y-1">
        <Label className="flex items-center gap-2" htmlFor={id}>
          {label}
          <span className="font-normal text-muted-foreground tabular-nums">
            {values.length}/{max}
          </span>
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div
        className={cn(
          "w-full min-w-0 rounded-lg border border-input bg-transparent bg-clip-padding text-sm transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          "dark:bg-input/30",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex max-h-28 min-h-8 flex-wrap items-center gap-1 overflow-y-auto px-2.5 py-1">
          {values.map((value) => (
            <span
              className="flex h-[calc(--spacing(5.25))] w-fit min-w-0 max-w-full items-center gap-1 rounded-sm bg-muted px-1.5 font-medium text-foreground text-xs"
              key={value}
            >
              {value}
              <Button
                aria-label={`Remove ${value}`}
                className="-mr-0.5 size-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={() => onChange(removeValue(values, value))}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <HugeiconsIcon
                  className="pointer-events-none"
                  icon={Cancel01Icon}
                  strokeWidth={2}
                />
              </Button>
            </span>
          ))}
          <input
            className="min-w-16 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            disabled={disabled || atLimit}
            id={id}
            onBlur={commitDraft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitDraft();
              }
              if (event.key === "Escape") {
                event.stopPropagation();
                setDraft("");
              }
              if (
                event.key === "Backspace" &&
                draft.length === 0 &&
                values.length > 0
              ) {
                onChange(values.slice(0, -1));
              }
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (!text.includes(",")) {
                return;
              }
              event.preventDefault();
              onChange(addUniqueValues(values, `${draft} ${text}`, max));
              setDraft("");
            }}
            placeholder={atLimit ? undefined : placeholder}
            value={draft}
          />
        </div>
      </div>
    </div>
  );
}
