"use client";

import { ArrowUp02Icon, AtIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FEATURES } from "@notra/ai/billing/features";
import type { ContextItem } from "@notra/ai/types/chat";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@notra/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import { Textarea } from "@notra/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ChatContextConnectSuggestions } from "@/components/chat/chat-context-connect-suggestions";
import { ChatContextOptionContent } from "@/components/chat/chat-context-option-content";
import { ChatInputContextRow } from "@/components/chat/chat-input-context-row";
import { Composer } from "@/components/composer/composer-shell";
import { useAutumnRefreshListener } from "@/lib/hooks/use-autumn-refresh-listener";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  ChatInputProps,
  EnabledLinear,
  EnabledRepo,
} from "@/types/components/chat-input";
import {
  buildContentChatContextOptions,
  CHAT_INPUT_LIMIT_MESSAGE,
  contextItemsEqual,
} from "@/utils/chat-input";

const ChatInput = ({
  onSend,
  isLoading = false,
  disabled = false,
  statusText,
  completionMessage,
  selection,
  onClearSelection,
  organizationSlug,
  organizationId,
  context = [],
  onAddContext,
  onRemoveContext,
  value: controlledValue,
  onValueChange,
  error: externalError,
  onClearError,
}: ChatInputProps) => {
  const contextPickerId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [isContextPickerOpen, setIsContextPickerOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { check, data: customer, refetch: refetchCustomer } = useCustomer();

  useAutumnRefreshListener(refetchCustomer);

  const checkResult = useMemo(() => {
    if (!customer) {
      return null;
    }
    return check({
      featureId: FEATURES.AI_CREDITS,
      requiredBalance: 1,
    });
  }, [check, customer]);
  const remainingChatCredits =
    typeof checkResult?.balance?.remaining === "number"
      ? checkResult.balance.remaining
      : null;
  const shouldShowLowCredits =
    remainingChatCredits !== null &&
    remainingChatCredits > 0 &&
    remainingChatCredits <= 10;
  const isUsageBlocked =
    process.env.NODE_ENV !== "development" && checkResult?.allowed === false;
  const usageLimitError =
    externalError ??
    internalError ??
    (isUsageBlocked ? CHAT_INPUT_LIMIT_MESSAGE : null);
  const clearError = useCallback(() => {
    setInternalError(null);
    onClearError?.();
  }, [onClearError]);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = useCallback(
    (nextValue: string) => {
      if (isControlled) {
        onValueChange?.(nextValue);
        return;
      }

      setInternalValue(nextValue);
    },
    [isControlled, onValueChange]
  );

  const { data: integrationsData } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const enabledRepos = useMemo(() => {
    const result: EnabledRepo[] = [];
    for (const integration of integrationsData?.integrations ?? []) {
      for (const repo of integration.repositories) {
        if (repo.enabled) {
          result.push({ ...repo, integrationId: integration.id });
        }
      }
    }
    return result;
  }, [integrationsData?.integrations]);

  const enabledLinear = useMemo(() => {
    const result: EnabledLinear[] = [];
    for (const integration of integrationsData?.integrations ?? []) {
      if (integration.type === "linear" && integration.enabled) {
        result.push({
          id: integration.id,
          displayName: integration.displayName,
          integrationId: integration.id,
          teamName:
            "linearTeamName" in integration
              ? (integration.linearTeamName as string | null)
              : null,
        });
      }
    }
    return result;
  }, [integrationsData?.integrations]);

  const contextOptions = useMemo(
    () =>
      buildContentChatContextOptions({
        enabledLinear,
        enabledRepos,
      }),
    [enabledLinear, enabledRepos]
  );

  const isInContext = useCallback(
    (item: ContextItem) =>
      context.some((contextItem) => contextItemsEqual(contextItem, item)),
    [context]
  );

  const resizeTextarea = useCallback(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "0";
    const maxHeightRem = 12.5;
    const maxHeightPx =
      maxHeightRem *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    element.style.height = `${Math.min(element.scrollHeight / Number.parseFloat(getComputedStyle(document.documentElement).fontSize), maxHeightRem)}rem`;
    element.style.overflowY =
      element.scrollHeight > maxHeightPx ? "auto" : "hidden";
  }, []);

  const toggleContextItem = useCallback(
    (item: ContextItem, inContext: boolean) => {
      if (inContext) {
        onRemoveContext?.(item);
        return;
      }

      onAddContext?.(item);
    },
    [onAddContext, onRemoveContext]
  );

  useEffect(() => {
    if (isControlled) {
      requestAnimationFrame(resizeTextarea);
    }
  }, [isControlled, resizeTextarea]);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) {
      return;
    }

    clearError();

    if (isUsageBlocked) {
      setInternalError(CHAT_INPUT_LIMIT_MESSAGE);
      return;
    }

    if (customer) {
      const sendCheckResult = check({
        featureId: FEATURES.AI_CREDITS,
        requiredBalance: 1,
      });

      if (sendCheckResult?.allowed === false) {
        setInternalError(CHAT_INPUT_LIMIT_MESSAGE);
        return;
      }
    }

    onSend?.(trimmed);
    setValue("");
    requestAnimationFrame(resizeTextarea);
  }, [
    onSend,
    resizeTextarea,
    value,
    disabled,
    isLoading,
    check,
    customer,
    isUsageBlocked,
    clearError,
    setValue,
  ]);

  useHotkeys(
    "enter",
    (event) => {
      if (event.shiftKey) {
        return;
      }
      event.preventDefault();
      handleSend();
    },
    {
      enableOnFormTags: ["TEXTAREA"],
      enabled: isFocused,
    },
    [handleSend, isFocused]
  );

  const isInputLocked = disabled || isLoading || isUsageBlocked;
  let contextPickerDisabledReason: string | null = null;
  if (isLoading) {
    contextPickerDisabledReason =
      "Wait for the current response before changing tools or context.";
  } else if (isInputLocked) {
    contextPickerDisabledReason = "Context is unavailable right now.";
  }
  const hasContextChips = context.length > 0 || Boolean(selection);
  const statusMessage = isLoading ? statusText : (completionMessage ?? null);
  const showComposerNudge = hasContextChips || shouldShowLowCredits;

  return (
    <Composer.Frame
      nudge={
        showComposerNudge ? (
          <Composer.Nudge
            title={
              shouldShowLowCredits && !hasContextChips
                ? `${remainingChatCredits} chat messages left`
                : undefined
            }
          >
            {hasContextChips ? (
              <>
                <ChatInputContextRow
                  context={context}
                  onClearSelection={onClearSelection}
                  onRemoveContext={onRemoveContext}
                  selection={selection}
                />
                {shouldShowLowCredits ? (
                  <span className="text-muted-foreground text-xs">
                    {remainingChatCredits} chat messages left
                  </span>
                ) : null}
              </>
            ) : null}
          </Composer.Nudge>
        ) : null
      }
    >
      {usageLimitError ? (
        <div className="mx-2 mt-2 mb-1 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
          <span>{usageLimitError}</span>
          {organizationSlug ? (
            <Link
              className="font-medium underline underline-offset-2"
              href={`/${organizationSlug}/settings/billing`}
            >
              Upgrade
            </Link>
          ) : null}
        </div>
      ) : null}
      {statusMessage ? (
        <p className="line-clamp-1 px-3 pt-2 text-muted-foreground text-xs">
          {statusMessage}
        </p>
      ) : null}
      <div className="relative flex min-w-0 flex-col rounded-t-[13px] bg-background">
        <div className="flex w-full min-w-0 items-center rounded-t-[12px]">
          <div className="relative flex min-w-0 flex-1 cursor-text transition-colors [--lh:1lh]">
            <Textarea
              aria-label="Send a message"
              className="max-h-50 min-h-12 w-full resize-none whitespace-pre-wrap rounded-none border-0 bg-transparent px-3 py-2 text-foreground text-sm leading-6 caret-foreground shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isInputLocked}
              onBlur={() => setIsFocused(false)}
              onChange={(event) => {
                setValue(event.target.value);
              }}
              onFocus={() => setIsFocused(true)}
              onInput={resizeTextarea}
              placeholder={isLoading ? "AI is working..." : "Send a message..."}
              ref={textareaRef}
              rows={1}
              value={value}
            />
          </div>
        </div>
      </div>
      <Composer.Toolbar>
        <Tooltip>
          <TooltipTrigger
            render={
              contextPickerDisabledReason ? (
                // biome-ignore lint/a11y/useSemanticElements: a real button would illegally nest the disabled popover trigger button.
                <span
                  aria-disabled="true"
                  aria-label="Add tools or context"
                  className="inline-flex cursor-not-allowed"
                  role="button"
                  tabIndex={0}
                />
              ) : (
                <span className="inline-flex" />
              )
            }
          >
            <Popover
              modal
              onOpenChange={setIsContextPickerOpen}
              open={isContextPickerOpen}
            >
              <PopoverTrigger
                render={
                  <Composer.ToolbarButton
                    aria-controls={contextPickerId}
                    aria-expanded={isContextPickerOpen}
                    aria-haspopup="listbox"
                    aria-label="Add tools or context"
                    className="size-7 justify-center px-0"
                    disabled={isInputLocked}
                    role="combobox"
                  />
                }
              >
                <HugeiconsIcon className="size-4" icon={AtIcon} />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 p-0"
                id={contextPickerId}
                showBackdrop
                sideOffset={6}
              >
                <Command>
                  <CommandInput placeholder="Search tools and context..." />
                  <CommandList>
                    <CommandEmpty>
                      {contextOptions.length === 0
                        ? "No matching integrations."
                        : "No matching tools or context found."}
                    </CommandEmpty>
                    {contextOptions.length === 0 && organizationSlug ? (
                      <ChatContextConnectSuggestions
                        onSelect={() => setIsContextPickerOpen(false)}
                        organizationSlug={organizationSlug}
                      />
                    ) : null}
                    {contextOptions.length > 0 ? (
                      <CommandGroup heading="Context">
                        {contextOptions.map((option) => {
                          const inContext = isInContext(option.contextItem);
                          return (
                            <CommandItem
                              data-checked={inContext}
                              key={option.id}
                              keywords={[option.searchText]}
                              onSelect={() => {
                                toggleContextItem(
                                  option.contextItem,
                                  inContext
                                );
                                setIsContextPickerOpen(false);
                              }}
                              value={option.id}
                            >
                              <ChatContextOptionContent option={option} />
                              {inContext ? (
                                <HugeiconsIcon
                                  className="ml-auto size-3.5 text-primary"
                                  icon={Tick02Icon}
                                />
                              ) : null}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ) : null}
                  </CommandList>
                  {organizationSlug ? (
                    <div className="border-border border-t p-1">
                      <Link
                        className="flex items-center rounded-sm px-2 py-1.5 text-muted-foreground text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        href={`/${organizationSlug}/integrations`}
                        onClick={() => setIsContextPickerOpen(false)}
                      >
                        Manage integrations
                      </Link>
                    </div>
                  ) : null}
                </Command>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>
            {contextPickerDisabledReason ?? "Tools and context"}
          </TooltipContent>
        </Tooltip>
        <Composer.Send
          busy={isLoading}
          disabled={isInputLocked || value.trim().length === 0}
          label="Send message"
          onClick={handleSend}
          tooltip={
            isLoading
              ? "AI is thinking..."
              : "Enter to send. Shift+Enter for a new line."
          }
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowUp02Icon}
            strokeWidth={2}
          />
        </Composer.Send>
      </Composer.Toolbar>
    </Composer.Frame>
  );
};

export default ChatInput;
