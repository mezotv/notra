"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Button } from "@/components/button";
import {
  MAX_REQUIRED_APPROVALS,
  MAX_WORKFLOW_STEPS,
  MIN_REQUIRED_APPROVALS,
} from "@/lib/publishing/constants";
import {
  clampRequiredApprovals,
  createStepDraft,
  moveStep,
} from "@/lib/publishing/steps";
import type {
  WorkflowStepDraft,
  WorkflowStepsBuilderProps,
} from "@/types/settings/publishing";

export function WorkflowStepsBuilder({
  steps,
  accessGroups,
  disabled,
  onStepsChange,
}: WorkflowStepsBuilderProps) {
  const updateStep = (index: number, patch: Partial<WorkflowStepDraft>) => {
    onStepsChange(
      steps.map((step, current) =>
        current === index ? { ...step, ...patch } : step
      )
    );
  };

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          className="space-y-3 rounded-lg border border-border/80 bg-background px-3 py-3"
          key={step.key}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">Step {index + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                className="size-7 p-0"
                disabled={disabled || index === 0}
                onClick={() => onStepsChange(moveStep(steps, index, -1))}
                type="button"
                variant="ghost"
              >
                <span className="sr-only">Move step up</span>
                <HugeiconsIcon className="size-4" icon={ArrowUp01Icon} />
              </Button>
              <Button
                className="size-7 p-0"
                disabled={disabled || index === steps.length - 1}
                onClick={() => onStepsChange(moveStep(steps, index, 1))}
                type="button"
                variant="ghost"
              >
                <span className="sr-only">Move step down</span>
                <HugeiconsIcon className="size-4" icon={ArrowDown01Icon} />
              </Button>
              <Button
                className="size-7 p-0"
                disabled={disabled || steps.length === 1}
                onClick={() =>
                  onStepsChange(steps.filter((_, current) => current !== index))
                }
                type="button"
                variant="ghost"
              >
                <span className="sr-only">Remove step</span>
                <HugeiconsIcon className="size-4" icon={Delete02Icon} />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-2">
              <Label htmlFor={`${step.key}-reviewer`}>
                Reviewer access group
              </Label>
              <Select
                disabled={disabled}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    updateStep(index, { reviewerAccessGroupId: value });
                  }
                }}
                value={step.reviewerAccessGroupId}
              >
                <SelectTrigger className="w-full" id={`${step.key}-reviewer`}>
                  <SelectValue placeholder="Select an access group" />
                </SelectTrigger>
                <SelectContent>
                  {accessGroups.map((accessGroup) => (
                    <SelectItem key={accessGroup.id} value={accessGroup.id}>
                      {accessGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${step.key}-approvals`}>Approvals</Label>
              <Input
                disabled={disabled}
                id={`${step.key}-approvals`}
                max={MAX_REQUIRED_APPROVALS}
                min={MIN_REQUIRED_APPROVALS}
                onChange={(event) =>
                  updateStep(index, {
                    requiredApprovals: clampRequiredApprovals(
                      Number(event.target.value)
                    ),
                  })
                }
                type="number"
                value={step.requiredApprovals}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${step.key}-name`}>Step label (optional)</Label>
            <Input
              disabled={disabled}
              id={`${step.key}-name`}
              onChange={(event) =>
                updateStep(index, { name: event.target.value })
              }
              placeholder="Editorial review"
              value={step.name}
            />
          </div>
        </div>
      ))}

      <Button
        className="w-full justify-center"
        disabled={disabled || steps.length >= MAX_WORKFLOW_STEPS}
        onClick={() => onStepsChange([...steps, createStepDraft()])}
        type="button"
        variant="outline"
      >
        <HugeiconsIcon className="size-4" icon={Add01Icon} />
        Add step
      </Button>
    </div>
  );
}
