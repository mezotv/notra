"use client";

import {
  Cancel01Icon,
  Clock01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationScrollToBottomOnChange,
} from "@notra/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import { BrailleLoader } from "@notra/ui/components/shared/braille-loader";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { getToolName, isToolUIPart } from "ai";
import { Fragment, type ReactNode } from "react";

import { ChatReasoningBlock } from "@/components/ai/chat-reasoning-block";
import { ChatToolBlock } from "@/components/ai/chat-tool-block";
import { ChatInputContextRow } from "@/components/chat/chat-input-context-row";
import type {
  ContentChatActivityMessageProps,
  ContentChatActivityPanelProps,
} from "@/types/components/content-chat-activity-panel";
import {
  getContentChatAttachments,
  hasContentChatAttachments,
} from "@/utils/content-chat-attachments";
import { getContentChatHistoryGroups } from "@/utils/content-chat-history";

const ACTIVITY_MESSAGE_CLASSNAME =
  "translate-y-0 opacity-100 transition-[opacity,translate] duration-fast ease-emphasized starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none motion-reduce:starting:translate-y-0 motion-reduce:starting:opacity-100";

function ContentChatActivityFeed({
  children,
  scrollKey,
}: {
  children: ReactNode;
  scrollKey: string;
}) {
  return (
    <Conversation className="min-h-0 min-w-0 flex-1 overflow-x-clip">
      <ConversationScrollToBottomOnChange scrollKey={scrollKey} />
      <ConversationContent className="flex min-w-0 flex-col gap-4 px-4 pt-4 pb-14">
        {children}
      </ConversationContent>
      <ConversationScrollButton aria-label="Scroll to latest messages" />
    </Conversation>
  );
}

function ContentChatActivityMessage({
  message,
  status,
}: ContentChatActivityMessageProps) {
  const attachments =
    message.role === "user"
      ? getContentChatAttachments(message.metadata)
      : { selection: null, context: [] };
  const showAttachments = hasContentChatAttachments(attachments);

  return (
    <div className={ACTIVITY_MESSAGE_CLASSNAME}>
      <Message from={message.role}>
        {showAttachments ? (
          <div
            aria-label="Attached context"
            className="ml-auto flex max-w-full flex-wrap justify-end gap-1.5"
          >
            <ChatInputContextRow
              context={attachments.context}
              selection={attachments.selection}
            />
          </div>
        ) : null}
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
    </div>
  );
}

export function ContentChatActivityPanel({
  children,
  messages,
  sessions,
  activeChatId,
  isHistoryLoading,
  status,
  onNewChat,
  onSelectChat,
  onClose,
}: ContentChatActivityPanelProps) {
  const historyGroups = getContentChatHistoryGroups(sessions);
  const isAgentBusy = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);
  const lastAssistantHasNoVisibleContent =
    lastMessage?.role === "assistant" &&
    !lastMessage.parts.some(
      (part) =>
        (part.type === "text" && Boolean(part.text.trim())) ||
        (part.type === "reasoning" && Boolean(part.text.trim())) ||
        isToolUIPart(part)
    );
  const showThinkingIndicator =
    isAgentBusy &&
    (lastMessage?.role === "user" || lastAssistantHasNoVisibleContent);
  const visibleMessages =
    showThinkingIndicator && lastAssistantHasNoVisibleContent
      ? messages.slice(0, -1)
      : messages;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="bg-muted flex h-12 shrink-0 items-center justify-between gap-2 rounded-t-[calc(0.75rem-1px)] px-4">
        <h2 className="text-foreground flex h-full min-w-0 items-center truncate text-sm leading-none">
          Content Agent
        </h2>
        <div className="-mr-1.5 flex h-full items-center gap-0.5">
          <Button
            disabled={isAgentBusy}
            onClick={onNewChat}
            size="icon-sm"
            variant="ghost"
          >
            <span className="sr-only">Start a new chat</span>
            <HugeiconsIcon
              className="size-4"
              icon={PlusSignIcon}
              strokeWidth={1.8}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex"
              disabled={isAgentBusy}
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <span className="sr-only">Open chat history</span>
              <HugeiconsIcon
                className="size-4"
                icon={Clock01Icon}
                strokeWidth={1.8}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-72 w-52"
              sideOffset={6}
            >
              {isHistoryLoading ? (
                <p className="text-muted-foreground px-2 py-1.5 text-center text-xs">
                  Loading chats...
                </p>
              ) : null}
              {!isHistoryLoading && sessions.length === 0 ? (
                <p className="text-muted-foreground px-2 py-1.5 text-center text-xs">
                  No previous chats
                </p>
              ) : null}
              {!isHistoryLoading && sessions.length > 0
                ? historyGroups.map((group, groupIndex) => (
                    <Fragment key={group.label}>
                      {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        {group.sessions.map((session) => (
                          <DropdownMenuItem
                            className="data-[active=true]:bg-accent/70"
                            data-active={activeChatId === session.chatId}
                            disabled={isAgentBusy}
                            key={session.chatId}
                            onClick={() => onSelectChat(session.chatId)}
                            title={session.title}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {session.title}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </Fragment>
                  ))
                : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2"
                disabled={isAgentBusy}
                onClick={onNewChat}
              >
                <HugeiconsIcon
                  className="size-4 shrink-0"
                  icon={PlusSignIcon}
                  strokeWidth={1.8}
                />
                <span>New chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="cursor-pointer"
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <span className="sr-only">Close Content Agent</span>
            <HugeiconsIcon
              className="size-4"
              icon={Cancel01Icon}
              strokeWidth={1.8}
            />
          </Button>
        </div>
      </header>
      <div className="bg-muted flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[calc(0.75rem-1px)]">
        <div className="bg-background flex min-h-0 flex-1 flex-col rounded-t-xl">
          <ContentChatActivityFeed scrollKey={activeChatId ?? ""}>
            <div className="flex min-w-0 flex-col gap-4">
              {visibleMessages.map((message) => (
                <ContentChatActivityMessage
                  key={message.id}
                  message={message}
                  status={status}
                />
              ))}
              {showThinkingIndicator ? (
                <BrailleLoader
                  className="text-muted-foreground text-sm"
                  label="Thinking"
                />
              ) : null}
            </div>
          </ContentChatActivityFeed>
          {children}
        </div>
      </div>
    </div>
  );
}
