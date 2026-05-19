"use client";

import { Switch } from "@notra/ui/components/ui/switch";
import { useId } from "react";

interface DataPointToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function DataPointToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: DataPointToggleProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <p className="font-medium text-sm" id={labelId}>
          {label}
        </p>
        <p
          className="truncate text-muted-foreground text-xs"
          id={descriptionId}
        >
          {description}
        </p>
      </div>
      <Switch
        aria-describedby={descriptionId}
        aria-labelledby={labelId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
