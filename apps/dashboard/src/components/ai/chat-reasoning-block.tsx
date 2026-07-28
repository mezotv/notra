"use client";

import { AiBrain01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { useEffect, useRef, useState } from "react";
import { BrailleLoader } from "@/components/braille-loader";
import {
  REASONING_AUTO_CLOSE_DELAY_MS,
  REASONING_CONTENT_CLASSNAME,
  THINKING_LABEL,
} from "@/constants/chat-reasoning";
import type {
  ChatReasoningBlockProps,
  ChatReasoningBlockState,
} from "@/types/components/chat-reasoning-block";
import { formatReasoningDurationLabel } from "@/utils/format-reasoning-duration";

export function ChatReasoningBlock({
  children,
  isStreaming,
}: ChatReasoningBlockProps) {
  const [reasoningState, setReasoningState] = useState<ChatReasoningBlockState>(
    {
      durationSeconds: null,
      isOpen: false,
      wasStreaming: null,
    }
  );
  const startTimeRef = useRef<number | null>(null);

  if (reasoningState.wasStreaming !== isStreaming) {
    setReasoningState({
      durationSeconds: isStreaming ? null : reasoningState.durationSeconds,
      isOpen: isStreaming ? true : reasoningState.isOpen,
      wasStreaming: isStreaming,
    });
  }

  useEffect(() => {
    if (isStreaming) {
      startTimeRef.current = Date.now();
      return;
    }

    const durationTimer = window.setTimeout(() => {
      const startedAt = startTimeRef.current;

      setReasoningState((current) => ({
        ...current,
        durationSeconds: startedAt
          ? Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))
          : null,
      }));
    }, 0);

    const closeTimer = window.setTimeout(() => {
      setReasoningState((current) => ({ ...current, isOpen: false }));
    }, REASONING_AUTO_CLOSE_DELAY_MS);

    return () => {
      window.clearTimeout(durationTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isStreaming]);

  const statusLabel = isStreaming
    ? THINKING_LABEL
    : formatReasoningDurationLabel(reasoningState.durationSeconds);

  function handleOpenChange(isOpen: boolean) {
    setReasoningState((current) => ({ ...current, isOpen }));
  }

  return (
    <Collapsible onOpenChange={handleOpenChange} open={reasoningState.isOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
        {isStreaming ? (
          <BrailleLoader className="text-sm" label={statusLabel} />
        ) : (
          <>
            <HugeiconsIcon className="size-4" icon={AiBrain01Icon} />
            <span>{statusLabel}</span>
          </>
        )}
        <HugeiconsIcon
          className={`size-4 transition-transform ${reasoningState.isOpen ? "rotate-180" : "rotate-0"}`}
          icon={ArrowDown01Icon}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className={REASONING_CONTENT_CLASSNAME}>
        <div className="pt-4">
          <MessageResponse className="text-muted-foreground text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </MessageResponse>
          <div className="h-3" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
