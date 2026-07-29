"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import type { WorkflowListProps } from "@/types/settings/publishing";
import { WorkflowCard } from "./workflow-card";

export function WorkflowList({
  workflows,
  canManage,
  isLoading,
  onEdit,
  onDelete,
}: WorkflowListProps) {
  const skeletonId = useId();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="space-y-3 rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-3 shadow-2xs"
            key={`${skeletonId}-workflow-${index}`}
          >
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-12 w-40 rounded-md" />
              <Skeleton className="h-12 w-40 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-10 text-center text-muted-foreground text-sm shadow-2xs">
        No approval workflows yet. Content can be published without review.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          canManage={canManage}
          key={workflow.id}
          onDelete={onDelete}
          onEdit={onEdit}
          workflow={workflow}
        />
      ))}
    </div>
  );
}
