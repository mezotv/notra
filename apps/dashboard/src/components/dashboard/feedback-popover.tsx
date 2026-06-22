"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { cn } from "@notra/ui/lib/utils";
import { usePathname } from "next/navigation";
import { cloneElement, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useFeedback } from "@/components/dashboard/feedback-context";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { FEEDBACK_MAX_MESSAGE_LENGTH } from "@/constants/feedback";
import { dashboardOrpcClient } from "@/lib/orpc/client";
import type {
  FeedbackFormProps,
  FeedbackPopoverProps,
  FeedbackSentiment,
} from "@/types/dashboard/feedback";
import { FEEDBACK_SENTIMENT_OPTIONS } from "@/utils/feedback";
import { getFeedbackPageUrl } from "@/utils/feedback-page-url";

export function FeedbackForm({
  onSubmitted,
  autoFocus = true,
}: FeedbackFormProps) {
  const pathname = usePathname();
  const { activeOrganization } = useOrganizationsContext();

  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dashboardOrpcClient.feedback.submit({
        message: trimmed,
        sentiment: sentiment ?? undefined,
        organizationId: activeOrganization?.id,
        pageUrl: getFeedbackPageUrl(pathname),
      });

      toast.success("Thanks for the feedback!");
      setMessage("");
      setSentiment(null);
      onSubmitted?.();
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Failed to send feedback";
      setIsSubmitting(false);
      toast.error(errMessage);
      return;
    }
    setIsSubmitting(false);
  }

  async function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      await handleSubmit();
    }
  }

  return (
    <>
      <div className="p-2.5 pb-0">
        <Textarea
          aria-label="Your feedback"
          autoFocus={autoFocus}
          className="min-h-28 resize-none"
          disabled={isSubmitting}
          maxLength={FEEDBACK_MAX_MESSAGE_LENGTH}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your feedback..."
          value={message}
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-border border-t border-dashed p-2.5">
        <div className="flex items-center gap-0.5">
          {FEEDBACK_SENTIMENT_OPTIONS.map((option) => {
            const isActive = sentiment === option.value;
            return (
              <button
                aria-label={option.label}
                aria-pressed={isActive}
                className={cn(
                  "flex size-7 cursor-pointer items-center justify-center rounded-md text-base leading-none outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isActive
                    ? "bg-muted opacity-100"
                    : "opacity-60 hover:opacity-100"
                )}
                disabled={isSubmitting}
                key={option.value}
                onClick={() =>
                  setSentiment((current) =>
                    current === option.value ? null : option.value
                  )
                }
                type="button"
              >
                <span aria-hidden="true">{option.emoji}</span>
              </button>
            );
          })}
        </div>

        <Button
          disabled={!canSubmit}
          onClick={handleSubmit}
          size="sm"
          type="button"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              Send
              <HugeiconsIcon
                className="-translate-y-px"
                icon={SentIcon}
                size={14}
              />
            </>
          )}
        </Button>
      </div>
    </>
  );
}

export function FeedbackPopover({
  trigger,
  side = "bottom",
  align = "end",
  sharedState = false,
}: FeedbackPopoverProps = {}) {
  const feedback = useFeedback();
  const [localOpen, setLocalOpen] = useState(false);
  const open = sharedState ? feedback.open : localOpen;
  const setOpen = sharedState ? feedback.setOpen : setLocalOpen;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          trigger ? (
            cloneElement(trigger)
          ) : (
            <Button className="gap-1.5" size="sm" variant="outline">
              Feedback
            </Button>
          )
        }
      />
      <PopoverContent
        align={align}
        className="w-80 gap-0 p-0"
        side={side}
        sideOffset={8}
      >
        {open ? <FeedbackForm onSubmitted={() => setOpen(false)} /> : null}
      </PopoverContent>
    </Popover>
  );
}
