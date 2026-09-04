"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import type { ComponentProps } from "react";
import { useCallback, useEffect } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "@notra/ui/lib/utils";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-hidden", className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn("flex flex-col gap-8 p-4", className)}
    {...props}
  />
);

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string;
  description?: string;
  icon?: IconSvgElement;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && (
          <div className="text-muted-foreground">
            <HugeiconsIcon className="size-8" icon={icon} />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="font-medium text-sm">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </>
    )}
  </div>
);

export type ConversationScrollToBottomOnChangeProps = {
  scrollKey: string;
};

export function ConversationScrollToBottomOnChange({
  scrollKey,
}: ConversationScrollToBottomOnChangeProps) {
  const { scrollToBottom } = useStickToBottomContext();

  useEffect(() => {
    scrollToBottom();
  }, [scrollKey, scrollToBottom]);

  return null;
}

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <Button
      className={cn(
        "absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-sm",
        "transition-opacity duration-normal ease-emphasized motion-reduce:transition-none",
        "data-[active=false]:pointer-events-none data-[active=false]:opacity-0 data-[active=false]:duration-slow data-[active=false]:ease-emphasized-in",
        "data-[active=true]:opacity-100",
        className
      )}
      data-active={!isAtBottom}
      onClick={handleScrollToBottom}
      size="icon"
      variant="secondary"
      {...props}
    >
      <HugeiconsIcon className="size-4" icon={ArrowDown01Icon} />
    </Button>
  );
};
