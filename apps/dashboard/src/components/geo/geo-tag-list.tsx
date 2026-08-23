"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { useState } from "react";
import {
  addUniqueValues,
  LINE_BREAK_REGEX,
  removeValue,
} from "@/lib/geo/string-list";
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
  labeled = true,
  inputClassName,
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
      {labeled ? (
        <div className="space-y-1">
          <Label className="flex items-center gap-2" htmlFor={id}>
            {label}
            <span className="font-normal text-muted-foreground tabular-nums">
              {values.length}/{max}
            </span>
          </Label>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
        </div>
      ) : null}
      <Input
        aria-label={labeled ? undefined : label}
        className={inputClassName}
        disabled={disabled || atLimit}
        id={id}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
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
          if (!LINE_BREAK_REGEX.test(text)) {
            return;
          }
          event.preventDefault();
          onChange(addUniqueValues(values, `${draft}${text}`, max));
          setDraft("");
        }}
        placeholder={atLimit ? undefined : placeholder}
        value={draft}
      />
      {values.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((value) => (
            <Badge className="gap-1 pr-1" key={value} variant="secondary">
              {value}
              <button
                aria-label={`Remove ${value}`}
                className="cursor-pointer rounded-sm p-0.5 hover:bg-background disabled:cursor-not-allowed"
                disabled={disabled}
                onClick={() => onChange(removeValue(values, value))}
                type="button"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
