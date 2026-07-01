import {
  Add01Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/button";
import type {
  EventTriggerDialogFooterProps,
  EventTriggerFooterStatusProps,
} from "@/types/automation/event-trigger";

function FooterStatus({
  errorMessage,
  repositoryCount,
}: EventTriggerFooterStatusProps) {
  if (errorMessage) {
    return (
      <span className="flex items-center gap-1.5 font-medium text-destructive text-xs">
        <HugeiconsIcon className="size-3.5" icon={AlertCircleIcon} />
        {errorMessage}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
      {repositoryCount === 0
        ? "No repositories selected yet"
        : `${repositoryCount} ${repositoryCount === 1 ? "repository" : "repositories"} selected`}
    </span>
  );
}

export function EventTriggerDialogFooter({
  errorMessage,
  isEditMode,
  isPending,
  onCancel,
  repositoryCount,
}: EventTriggerDialogFooterProps) {
  return (
    <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <FooterStatus
          errorMessage={errorMessage}
          repositoryCount={repositoryCount}
        />
        <div className="flex items-center gap-2">
          <Button
            disabled={isPending}
            onClick={onCancel}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? (
              <>
                <HugeiconsIcon
                  className="size-4 animate-spin"
                  icon={Loading03Icon}
                />
                {isEditMode ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                <HugeiconsIcon className="size-4" icon={Add01Icon} />
                {isEditMode ? "Save changes" : "Add trigger"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
