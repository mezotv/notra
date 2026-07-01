import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import type { TriggerSwitchRowProps } from "@/types/automation/event-trigger";

export function TriggerSwitchRow({
  id,
  label,
  tooltip,
  checked,
  onCheckedChange,
}: TriggerSwitchRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-1.5">
        <Label className="cursor-pointer font-medium text-sm" htmlFor={id}>
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger className="inline-flex cursor-help text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} size={14} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-50 text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch checked={checked} id={id} onCheckedChange={onCheckedChange} />
    </div>
  );
}
