import { Badge } from "@notra/ui/components/ui/badge";

import type { IrisRunStatusBadgeProps } from "@/types/iris";
import { humanizeIrisRunStatus } from "@/utils/iris-copy";

const RUN_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  failed: "destructive",
  canceled: "outline",
  planning: "secondary",
  executing: "secondary",
};

export function IrisRunStatusBadge({ status }: IrisRunStatusBadgeProps) {
  return (
    <Badge variant={RUN_STATUS_VARIANTS[status] ?? "secondary"}>
      {humanizeIrisRunStatus(status)}
    </Badge>
  );
}
