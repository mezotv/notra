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
  CUSTOM_ROLE_BADGE_LABEL,
  SYSTEM_ROLE_BADGE_LABEL,
} from "@/lib/roles/constants";
import { formatMemberCount, summarizeScopes } from "@/lib/roles/scopes";
import type { RoleRowProps } from "@/types/settings/roles";

export function RoleRow({
  role,
  scopeLabels,
  canManage,
  onEdit,
  onDelete,
}: RoleRowProps) {
  const summary = summarizeScopes(role.scopes, scopeLabels);
  const showActions = canManage && !role.isSystem;

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{role.name}</span>
          <Badge variant={role.isSystem ? "secondary" : "outline"}>
            {role.isSystem ? SYSTEM_ROLE_BADGE_LABEL : CUSTOM_ROLE_BADGE_LABEL}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatMemberCount(role.memberCount)}
          </span>
        </div>

        {role.description && (
          <p className="text-muted-foreground text-sm">{role.description}</p>
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
                <span className="sr-only">Open role menu</span>
                <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <HugeiconsIcon className="mr-2 size-4" icon={Edit02Icon} />
              Edit role
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(role)}
              variant="destructive"
            >
              <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
              Delete role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
