import {
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";

import type { Trigger } from "@/types/triggers/triggers";

interface TriggerRowActionsProps {
  trigger: Trigger;
  onToggle: (trigger: Trigger) => void;
  onDelete: (triggerId: string) => void;
  onEdit?: (trigger: Trigger) => void;
}

export function TriggerRowActions({
  trigger,
  onToggle,
  onDelete,
  onEdit,
}: TriggerRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent">
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={MoreVerticalIcon}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(trigger)}>
            <HugeiconsIcon className="size-4" icon={Edit02Icon} />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onToggle(trigger)}>
          <HugeiconsIcon
            className="size-4"
            icon={trigger.enabled ? PauseIcon : PlayIcon}
          />
          {trigger.enabled ? "Pause" : "Enable"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(trigger.id)}
          variant="destructive"
        >
          <HugeiconsIcon className="size-4" icon={Delete02Icon} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
