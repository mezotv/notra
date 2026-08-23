"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import type { ReactNode } from "react";
import { GEO_GAPS_LOGO_STACK_LIMIT } from "@/constants/geo";

export interface LogoStackItem {
  key: string;
  label: string;
  detail?: string | null;
  renderIcon: (className: string) => ReactNode;
}

export interface LogoStackProps {
  items: LogoStackItem[];
  limit?: number;
}

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
}: LogoStackProps) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = items.slice(0, limit);
  const hidden = items.slice(limit);

  return (
    <span className="inline-flex items-center gap-1">
      {visible.map((item) => (
        <Tooltip key={item.key}>
          <TooltipTrigger
            render={<span className="inline-flex shrink-0 cursor-default" />}
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
