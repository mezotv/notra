"use client";

import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { GEO_PROMPT_MIN_LENGTH, GEO_SEQUENCE_MAX_TURNS } from "@/constants/geo";
import {
  useGeoSequenceCreate,
  useGeoSequenceUpdate,
} from "@/lib/hooks/use-geo";
import type { ConversationBuilderDialogProps } from "@/types/geo";

export function ConversationBuilderDialog({
  open,
  onOpenChange,
  organizationId,
  sequence,
}: ConversationBuilderDialogProps) {
  const nameId = useId();
  const create = useGeoSequenceCreate(organizationId);
  const update = useGeoSequenceUpdate(organizationId);
  const [name, setName] = useState(sequence?.name ?? "");
  const [steps, setSteps] = useState<string[]>(
    sequence && sequence.steps.length > 0 ? sequence.steps : [""]
  );

  const pending = create.isPending || update.isPending;
  const validSteps = steps
    .map((step) => step.trim())
    .filter((step) => step.length >= GEO_PROMPT_MIN_LENGTH);
  const canSave = name.trim().length > 0 && validSteps.length > 0 && !pending;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName(sequence?.name ?? "");
      setSteps(sequence && sequence.steps.length > 0 ? sequence.steps : [""]);
    }
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    if (sequence) {
      await update.mutateAsync({
        sequenceId: sequence.id,
        name: name.trim(),
        steps: validSteps,
      });
    } else {
      await create.mutateAsync({ name: name.trim(), steps: validSteps });
      setName("");
      setSteps([""]);
    }
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {sequence ? `Edit ${sequence.name}` : "New conversation"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            A real buyer conversation: an opening question and the follow-ups
            that decide the purchase. Every turn is checked for your brand.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              onChange={(event) => setName(event.target.value)}
              placeholder="Changelog tool research"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label>Turns</Label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  className="flex items-start gap-2"
                  key={`turn-${index.toString()}`}
                >
                  <span className="mt-2 w-5 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2">
                    <textarea
                      className="block w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      onChange={(event) =>
                        setSteps((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          )
                        )
                      }
                      placeholder={
                        index === 0
                          ? "What is the best tool to automate changelogs?"
                          : "Which of those is the cheapest?"
                      }
                      rows={2}
                      value={step}
                    />
                  </div>
                  {steps.length > 1 && (
                    <Button
                      aria-label={`Remove turn ${index + 1}`}
                      className="mt-1 shrink-0"
                      onClick={() =>
                        setSteps((previous) =>
                          previous.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {steps.length < GEO_SEQUENCE_MAX_TURNS && (
              <Button
                className="ml-7"
                onClick={() => setSteps((previous) => [...previous, ""])}
                size="sm"
                type="button"
                variant="outline"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
                Add follow-up
              </Button>
            )}
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button disabled={!canSave} onClick={handleSave} type="button">
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {sequence ? "Save changes" : "Create conversation"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
