"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { GEO_GAPS_LOGO_STACK_LIMIT } from "@notra/ui/constants/geo";
import type { LogoStackItem, LogoStackProps } from "@notra/ui/types/geo";

function LogoStackItemDetail({ item }: { item: LogoStackItem }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex shrink-0">{item.renderIcon("size-5")}</span>
      <span className="min-w-0">
        <span className="block font-medium">{item.label}</span>
        {item.detail ? (
          <span className="block text-muted-foreground text-xs">
            {item.detail}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function LogoStack({
  items,
  limit = GEO_GAPS_LOGO_STACK_LIMIT,
  emptyLabel,
}: LogoStackProps) {
  if (items.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">
        {emptyLabel ?? "None"}
      </span>
    );
  }

  const visible = items.slice(0, limit);
  const hidden = items.slice(limit);

  return (
    <span className="inline-flex items-center gap-1">
      {visible.map((item) => (
        <Tooltip key={item.key}>
          <TooltipTrigger
            aria-label={item.label}
            render={<span className="inline-flex shrink-0 cursor-default" />}
            role="img"
          >
            {item.renderIcon("size-4")}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <LogoStackItemDetail item={item} />
          </TooltipContent>
        </Tooltip>
      ))}
      {hidden.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            aria-label={`Additional: ${hidden.map((item) => item.label).join(", ")}`}
            render={
              <span className="cursor-default text-muted-foreground text-xs" />
            }
          >
            +{hidden.length}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <span className="flex flex-col gap-1.5">
              {hidden.map((item) => (
                <LogoStackItemDetail item={item} key={item.key} />
              ))}
            </span>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
