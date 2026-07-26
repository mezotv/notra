"use client";

import { CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { cn } from "@notra/ui/lib/utils";
import { getMcpIconUrls } from "@/lib/integrations/mcp";
import type { McpIconProps } from "@/types/integrations/mcp";

export function McpIcon({ darkUrl, lightUrl, className }: McpIconProps) {
  const iconUrls = getMcpIconUrls({ darkUrl, lightUrl });

  return (
    <span className={cn("relative size-4 shrink-0", className)}>
      <Avatar className="size-full rounded-sm after:hidden dark:hidden">
        <AvatarImage
          className="rounded-sm object-contain"
          src={iconUrls.lightUrl ?? undefined}
        />
        <AvatarFallback className="rounded-sm bg-transparent">
          <HugeiconsIcon className="size-[75%]" icon={CpuIcon} />
        </AvatarFallback>
      </Avatar>
      <Avatar className="hidden size-full rounded-sm after:hidden dark:flex">
        <AvatarImage
          className="rounded-sm object-contain"
          src={iconUrls.darkUrl ?? undefined}
        />
        <AvatarFallback className="rounded-sm bg-transparent">
          <HugeiconsIcon className="size-[75%]" icon={CpuIcon} />
        </AvatarFallback>
      </Avatar>
    </span>
  );
}
