"use client";

import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import type { NotificationToggleRowProps } from "@/types/settings/notifications";

export function NotificationToggleRow({
  config,
  checked,
  disabled,
  onCheckedChange,
}: NotificationToggleRowProps) {
  const id = `notification-${config.key}`;

  return (
    <div className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-0.5">
        <Label className="cursor-pointer font-medium text-sm" htmlFor={id}>
          {config.label}
        </Label>
        <p className="text-muted-foreground text-xs">{config.description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
