"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import { cn } from "@notra/ui/lib/utils";
import type { NotificationToggleRowProps } from "@/types/settings/notifications";

export function NotificationToggleRow({
  config,
  checked,
  disabled,
  onCheckedChange,
}: NotificationToggleRowProps) {
  const id = `notification-${config.key}`;

  return (
    <Label
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted/60"
      )}
      htmlFor={id}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted text-muted-foreground">
        <HugeiconsIcon className="size-[18px]" icon={config.icon} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-sm">{config.label}</p>
        <p className="text-muted-foreground text-xs">{config.description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </Label>
  );
}

export function NotificationToggleRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-[18.4px] w-8 shrink-0 rounded-full" />
    </div>
  );
}
