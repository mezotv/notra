"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import type { RoleListProps } from "@/types/settings/roles";
import { RoleRow } from "./role-row";

export function RoleList({
  roles,
  scopeLabels,
  canManage,
  isLoading,
  onEdit,
  onDelete,
}: RoleListProps) {
  const skeletonId = useId();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-background shadow-2xs">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="space-y-2 px-4 py-3"
            key={`${skeletonId}-role-${index}`}
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-5 w-52 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-10 text-center text-muted-foreground text-sm shadow-2xs">
        No roles yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-background shadow-2xs">
      {roles.map((role) => (
        <RoleRow
          canManage={canManage}
          key={role.id}
          onDelete={onDelete}
          onEdit={onEdit}
          role={role}
          scopeLabels={scopeLabels}
        />
      ))}
    </div>
  );
}
