"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import type { AccessGroupListProps } from "@/types/settings/access-groups";
import { AccessGroupRow } from "./group-row";

export function AccessGroupList({
  accessGroups,
  scopeLabels,
  canManage,
  isLoading,
  onEdit,
  onDelete,
}: AccessGroupListProps) {
  const skeletonId = useId();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-background shadow-2xs">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="space-y-2 px-4 py-3"
            key={`${skeletonId}-access-group-${index}`}
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-5 w-52 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (accessGroups.length === 0) {
    return (
      <div className="rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-10 text-center text-muted-foreground text-sm shadow-2xs">
        No access groups yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-background shadow-2xs">
      {accessGroups.map((accessGroup) => (
        <AccessGroupRow
          accessGroup={accessGroup}
          canManage={canManage}
          key={accessGroup.id}
          onDelete={onDelete}
          onEdit={onEdit}
          scopeLabels={scopeLabels}
        />
      ))}
    </div>
  );
}
