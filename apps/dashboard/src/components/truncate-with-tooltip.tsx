"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TruncateWithTooltipProps {
  children: string;
  className?: string;
  contentClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

function isOverflowing(element: HTMLElement) {
  return element.scrollWidth > element.clientWidth;
}

export function TruncateWithTooltip({
  children,
  className,
  contentClassName,
  side = "top",
  align = "start",
}: TruncateWithTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const update = () => {
      setTruncated(isOverflowing(element));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  const label = (
    <span className={cn("block w-full min-w-0 truncate", className)} ref={ref}>
      {children}
    </span>
  );

  if (!truncated) {
    return label;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={label} />
      <TooltipContent
        align={align}
        className={cn("max-w-sm text-pretty", contentClassName)}
        side={side}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
