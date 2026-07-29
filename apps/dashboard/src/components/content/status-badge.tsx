"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { POST_STATUS_PRESENTATION } from "@/constants/post-status";
import { cn } from "@/lib/utils";
import type { PostStatusBadgeProps } from "@/types/content/status-badge";

export function PostStatusBadge({ status, className }: PostStatusBadgeProps) {
  const presentation = POST_STATUS_PRESENTATION[status];

  return (
    <Badge
      className={cn(presentation.className, className)}
      variant={presentation.variant}
    >
      {presentation.label}
    </Badge>
  );
}
