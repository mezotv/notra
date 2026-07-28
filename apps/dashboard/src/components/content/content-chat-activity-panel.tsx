"use client";

import { AiBrain01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import { Button } from "@notra/ui/components/ui/button";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@notra/ui/components/ui/message-scroller";
import { getToolName, isToolUIPart } from "ai";
import { m } from "motion/react";
import { ChatReasoningBlock } from "@/components/ai/chat-reasoning-block";
import { ChatToolBlock } from "@/components/ai/chat-tool-block";
import { BrailleLoader } from "@/components/braille-loader";
import type {
  ContentChatActivityMessageProps,
  ContentChatActivityPanelProps,
} from "@/types/components/content-chat-activity-panel";

function ContentChatActivityMessage({
  message,
  status,
}: ContentChatActivityMessageProps) {
  return (
    <m.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Message from={message.role}>
        <MessageContent>
          {message.parts.map((part, index) => {
            const key = `${message.id}-${index}`;

            if (part.type === "text") {
              if (!part.text.trim()) {
                return null;
              }
              return <MessageResponse key={key}>{part.text}</MessageResponse>;
            }

            if (part.type === "reasoning") {
              if (!part.text.trim()) {
                return null;
              }
              return (
                <ChatReasoningBlock
                  isStreaming={
                    status === "streaming" && part.state === "streaming"
                  }
                  key={key}
                >
                  {part.text}
                </ChatReasoningBlock>
              );
            }

            if (isToolUIPart(part)) {
              return (
                <ChatToolBlock
                  input={part.input}
                  key={part.toolCallId}
                  output={part.output}
                  state={part.state}
                  toolCallId={part.toolCallId}
                  toolName={getToolName(part)}
                />
              );
            }

            return null;
          })}
        </MessageContent>
      </Message>
    </m.div>
  );
}

export function ContentChatActivityPanel({
  messages,
  status,
  onClose,
}: ContentChatActivityPanelProps) {
  const showThinkingIndicator = status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 py-2 pr-2 pl-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="size-4 text-muted-foreground"
            icon={AiBrain01Icon}
          />
          <span className="font-medium text-sm">Agent activity</span>
        </div>
        <Button onClick={onClose} size="icon-sm" variant="ghost">
          <span className="sr-only">Close agent activity</span>
          <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
        </Button>
      </div>
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <HugeiconsIcon
            className="size-5 text-muted-foreground"
            icon={AiBrain01Icon}
          />
          <p className="text-muted-foreground text-sm">
            Ask the assistant to edit this content and every step shows up here
            as it happens: its thinking, the tools it runs, and its replies.
          </p>
        </div>
      ) : (
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport className="min-w-0 overflow-x-hidden">
              <MessageScrollerContent className="px-4 py-4">
                <div className="flex min-w-0 flex-col gap-4">
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <ContentChatActivityMessage
                        message={message}
                        status={status}
                      />
                    </MessageScrollerItem>
                  ))}
                  {showThinkingIndicator && (
                    <BrailleLoader
                      className="text-muted-foreground text-sm"
                      label="Thinking"
                    />
                  )}
                </div>
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      )}
    </div>
  );
}
