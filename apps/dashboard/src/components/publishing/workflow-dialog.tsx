"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  useCreateWorkflow,
  useUpdateWorkflow,
} from "@/lib/hooks/use-approval-workflows";
import { toStepDrafts, toStepPayload } from "@/lib/publishing/steps";
import { errorMessageOr } from "@/lib/utils";
import type {
  WorkflowDialogProps,
  WorkflowStepDraft,
} from "@/types/settings/publishing";
import { WorkflowStepsBuilder } from "./workflow-steps-builder";

export function WorkflowDialog({
  open,
  onOpenChange,
  organizationId,
  roles,
  workflow,
}: WorkflowDialogProps) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [isDefault, setIsDefault] = useState(workflow?.isDefault ?? false);
  const [appliesToRoleId, setAppliesToRoleId] = useState(
    workflow?.appliesToRole?.id ?? ""
  );
  const [steps, setSteps] = useState<WorkflowStepDraft[]>(
    toStepDrafts(workflow)
  );

  const createWorkflow = useCreateWorkflow(organizationId);
  const updateWorkflow = useUpdateWorkflow(organizationId);
  const isPending = createWorkflow.isPending || updateWorkflow.isPending;

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const hasCompleteSteps = steps.every(
    (step) => step.reviewerRoleId.length > 0
  );
  const canSubmit =
    !!organizationId &&
    trimmedName.length > 0 &&
    steps.length > 0 &&
    hasCompleteSteps;
  const submitLabel = workflow ? "Save changes" : "Create workflow";

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Add a name and pick a reviewer role for every step.");
      return;
    }

    const stepPayload = toStepPayload(steps);
    const resolvedRoleId = isDefault ? null : appliesToRoleId || null;

    const onError = (error: Error) => {
      toast.error(errorMessageOr(error.message, "Failed to save workflow"));
    };

    if (workflow) {
      updateWorkflow.mutate(
        {
          workflowId: workflow.id,
          name: trimmedName,
          description: trimmedDescription === "" ? null : trimmedDescription,
          appliesToRoleId: resolvedRoleId,
          isDefault,
          steps: stepPayload,
        },
        {
          onSuccess: () => {
            toast.success(`${trimmedName} has been updated`);
            onOpenChange(false);
          },
          onError,
        }
      );
      return;
    }

    createWorkflow.mutate(
      {
        name: trimmedName,
        description: trimmedDescription === "" ? undefined : trimmedDescription,
        appliesToRoleId: resolvedRoleId,
        isDefault,
        steps: stepPayload,
      },
      {
        onSuccess: () => {
          toast.success(`${trimmedName} has been created`);
          onOpenChange(false);
        },
        onError,
      }
    );
  };

  return (
    <ResponsiveDialog
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {workflow ? "Edit workflow" : "Create workflow"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Choose who has to approve content before it can be published.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="max-h-[24rem] space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              disabled={isPending}
              id="workflow-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Editorial approval"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              disabled={isPending}
              id="workflow-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="When this workflow applies"
              rows={2}
              value={description}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/80 bg-background px-3 py-2.5">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Default for everyone</p>
              <p className="text-muted-foreground text-xs">
                Applies to every member without a more specific workflow.
              </p>
            </div>
            <Switch
              checked={isDefault}
              disabled={isPending}
              onCheckedChange={setIsDefault}
            />
          </div>

          {!isDefault && (
            <div className="space-y-2">
              <Label htmlFor="workflow-applies-to">Applies to</Label>
              <Select
                disabled={isPending}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    setAppliesToRoleId(value);
                  }
                }}
                value={appliesToRoleId}
              >
                <SelectTrigger className="w-full" id="workflow-applies-to">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Authors with this role follow the steps below.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Approval steps</Label>
            <WorkflowStepsBuilder
              disabled={isPending}
              onStepsChange={setSteps}
              roles={roles}
              steps={steps}
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isPending}
            render={
              <Button
                className="w-full justify-center sm:w-auto"
                variant="outline"
              />
            }
          >
            Cancel
          </ResponsiveDialogClose>
          <Button
            className="w-full justify-center sm:w-auto"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
