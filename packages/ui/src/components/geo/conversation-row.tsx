"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import type { ConversationRowProps } from "@notra/ui/types/geo";

export function ConversationRow({
  name,
  steps,
  enabled,
  pending = false,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: ConversationRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <button
        className="min-w-0 flex-1 text-left"
        onClick={onOpen}
        type="button"
      >
        <p className="truncate font-medium text-sm">{name}</p>
        <p className="truncate text-muted-foreground text-xs">
          {steps.length} {steps.length === 1 ? "turn" : "turns"} · {steps[0]}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <Button onClick={onEdit} size="sm" variant="ghost">
          Edit
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Switch
                aria-label={enabled ? `Pause ${name}` : `Enable ${name}`}
                checked={enabled}
                disabled={pending}
                onCheckedChange={(next) => onToggle?.(next)}
                size="sm"
              />
            }
          />
          <TooltipContent>
            {enabled ? "Included in scans" : "Paused — skipped in scans"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={`Delete ${name}`}
                disabled={pending}
                onClick={onDelete}
                size="icon"
                variant="ghost"
              />
            }
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
