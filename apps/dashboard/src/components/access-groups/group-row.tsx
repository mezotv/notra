"use client";

import {
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Button } from "@/components/button";
import {
  CUSTOM_GROUP_BADGE_LABEL,
  SYSTEM_GROUP_BADGE_LABEL,
} from "@/lib/access-groups/constants";
import { formatMemberCount, summarizeScopes } from "@/lib/access-groups/scopes";
import type { AccessGroupRowProps } from "@/types/settings/access-groups";

export function AccessGroupRow({
  accessGroup,
  scopeLabels,
  canManage,
  onEdit,
  onDelete,
}: AccessGroupRowProps) {
  const summary = summarizeScopes(accessGroup.scopes, scopeLabels);
  const showActions = canManage && !accessGroup.isSystem;

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{accessGroup.name}</span>
          <Badge variant={accessGroup.isSystem ? "secondary" : "outline"}>
            {accessGroup.isSystem
              ? SYSTEM_GROUP_BADGE_LABEL
              : CUSTOM_GROUP_BADGE_LABEL}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatMemberCount(accessGroup.memberCount)}
          </span>
        </div>

        {accessGroup.description && (
          <p className="text-muted-foreground text-sm">
            {accessGroup.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {summary.visible.map((label) => (
            <Badge className="font-normal" key={label} variant="outline">
              {label}
            </Badge>
          ))}
          {summary.remaining > 0 && (
            <span className="text-muted-foreground text-xs">
              +{summary.remaining} more
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="size-8 shrink-0 p-0" variant="ghost">
                <span className="sr-only">Open access group menu</span>
                <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(accessGroup)}>
              <HugeiconsIcon className="mr-2 size-4" icon={Edit02Icon} />
              Edit access group
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(accessGroup)}
              variant="destructive"
            >
              <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
              Delete access group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
