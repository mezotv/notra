"use client";

import {
  ArrowRight01Icon,
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
import { DEFAULT_WORKFLOW_AUDIENCE_LABEL } from "@/lib/publishing/constants";
import { formatRequiredApprovals } from "@/lib/publishing/steps";
import type { WorkflowCardProps } from "@/types/settings/publishing";

export function WorkflowCard({
  workflow,
  canManage,
  onEdit,
  onDelete,
}: WorkflowCardProps) {
  const audience =
    workflow.appliesToRole?.name ??
    (workflow.isDefault ? DEFAULT_WORKFLOW_AUDIENCE_LABEL : "Not assigned");

  return (
    <div className="space-y-3 rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-3 shadow-2xs">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{workflow.name}</span>
            {workflow.isDefault && <Badge variant="secondary">Default</Badge>}
            <Badge className="font-normal" variant="outline">
              {audience}
            </Badge>
          </div>
          {workflow.description && (
            <p className="text-muted-foreground text-sm">
              {workflow.description}
            </p>
          )}
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="size-8 shrink-0 p-0" variant="ghost">
                  <span className="sr-only">Open workflow menu</span>
                  <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(workflow)}>
                <HugeiconsIcon className="mr-2 size-4" icon={Edit02Icon} />
                Edit workflow
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(workflow)}
                variant="destructive"
              >
                <HugeiconsIcon className="mr-2 size-4" icon={Delete02Icon} />
                Delete workflow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {workflow.steps.map((step, index) => (
          <div className="flex items-center gap-2" key={step.id}>
            {index > 0 && (
              <HugeiconsIcon
                className="size-4 text-muted-foreground"
                icon={ArrowRight01Icon}
              />
            )}
            <div className="rounded-md border border-border/70 bg-muted/60 px-2.5 py-1.5">
              <p className="font-medium text-xs">
                Step {step.stepOrder}
                {step.name ? `: ${step.name}` : ""}
              </p>
              <p className="text-muted-foreground text-xs">
                {step.reviewerRole.name} ·{" "}
                {formatRequiredApprovals(step.requiredApprovals)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
