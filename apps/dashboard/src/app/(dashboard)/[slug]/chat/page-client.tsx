"use client";

import { useChat } from "@ai-sdk/react";
import {
  AiBrain01Icon,
  ArrowDown01Icon,
  ArrowReloadHorizontalIcon,
  X,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { chatTransportRequestInputSchema } from "@notra/ai/schemas/chat";
import type { ContentType } from "@notra/ai/schemas/content";
import type {
  ChatAttachment,
  ChatImageAttachmentProps,
  ChatInputHandle,
  ChatMessagePart,
  ChatUIMessage,
  ContextItem,
} from "@notra/ai/types/chat";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@notra/ui/components/ui/message-scroller";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DefaultChatTransport,
  type DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  type ToolUIPart,
} from "ai";
import { LazyMotion, m } from "motion/react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChatToolBlock } from "@/components/ai/chat-tool-block";
import { BrailleLoader } from "@/components/braille-loader";
import { AssistantMetadataHover } from "@/components/chat/assistant-metadata-hover";
import { AttachmentPreviewDialog } from "@/components/chat/attachment-preview";
import {
  ChatInputAdvanced,
  type ThinkingLevel,
} from "@/components/chat/chat-input";
import { ChatQueue, type QueuedMessage } from "@/components/chat/chat-queue";
import { ChatSuggestions } from "@/components/chat/chat-suggestions";
import {
  getReferenceDisplay,
  parseReferenceValue,
  renderTextWithIntegrationReferences,
} from "@/components/chat/integration-reference";
import {
  UserMessageActions,
  UserMessageEditor,
} from "@/components/chat/user-message-actions";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { TOOL_TIMER_THRESHOLD_SECONDS } from "@/constants/chat-tool-timer";
import { localStorageKeys } from "@/constants/storage";
import { authClient } from "@/lib/auth/client";
import { useElapsedSeconds } from "@/lib/hooks/use-elapsed-seconds";
import { isImageMimeType } from "@/lib/upload/mime";
import { cn } from "@/lib/utils";
import type {
  CreateToolContentType,
  StandaloneChatPageClientProps,
} from "@/types/components/chat-page";
import { handleStandaloneChatError } from "@/utils/chat-error";
import {
  CHAT_PREFERENCES_STORAGE_KEY,
  DEFAULT_CHAT_PREFERENCES,
  parseStoredChatModel,
  parseStoredThinkingLevel,
  readStoredChatPreferences,
  writeStoredChatPreferences,
} from "@/utils/chat-preferences";
import { updateWasStoppedByUser } from "@/utils/chat-state";
import { formatLongDate, getGreeting } from "@/utils/dashboard-greeting";
import { formatElapsedSeconds } from "@/utils/format-elapsed-seconds";
import { getOutputTypeLabel } from "@/utils/output-types";

const BlogChangelogPreview = dynamic(
  () =>
    import("@/components/ai/blog-changelog-preview").then(
      (mod) => mod.BlogChangelogPreview
    ),
  { ssr: false }
);

const TwitterPreview = dynamic(
  () =>
    import("@/components/ai/twitter-preview").then((mod) => mod.TwitterPreview),
  { ssr: false }
);

const LinkedInPreview = dynamic(
  () =>
    import("@/components/ai/linkedin-preview").then(
      (mod) => mod.LinkedInPreview
    ),
  { ssr: false }
);

const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

const emptySubscribe = () => () => {
  // no external store to subscribe to; used to detect hydration
};

const THINKING_LABEL = "Thinking";
const REASONING_AUTO_CLOSE_DELAY_MS = 1000;
const REASONING_CONTENT_CLASSNAME =
  "h-[var(--collapsible-panel-height)] overflow-hidden text-sm text-muted-foreground outline-none transition-[height,opacity] duration-300 ease-out data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0";

function formatReasoningDurationLabel(durationSeconds: number | null): string {
  if (!durationSeconds || durationSeconds <= 1) {
    return "Thought for a moment";
  }

  return `Thought for ${durationSeconds} seconds`;
}

function ChatReasoningBlock({
  children,
  isStreaming,
}: {
  children: string;
  isStreaming: boolean;
}) {
  const [reasoningState, setReasoningState] = useState<{
    durationSeconds: number | null;
    isOpen: boolean;
    wasStreaming: boolean | null;
  }>({
    durationSeconds: null,
    isOpen: false,
    wasStreaming: null,
  });
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

function CreateToolPendingIndicator() {
  const elapsedSeconds = useElapsedSeconds(true);

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <BrailleLoader className="text-sm" label="Thinking" />
      {elapsedSeconds >= TOOL_TIMER_THRESHOLD_SECONDS && (
        <span className="shrink-0 text-muted-foreground/60 text-xs tabular-nums">
          {formatElapsedSeconds(elapsedSeconds)}
        </span>
      )}
    </div>
  );
}

const CREATE_TOOL_TYPES = {
  "tool-createBlogPost": "blog_post",
  "tool-createChangelog": "changelog",
  "tool-createInvestorUpdate": "investor_update",
  "tool-createLinkedInPost": "linkedin_post",
  "tool-createTwitterPost": "twitter_post",
} satisfies Record<string, ContentType>;

type RenderableToolPart = DynamicToolUIPart | ToolUIPart;

function isCreateTool(type: string): boolean {
  return type in CREATE_TOOL_TYPES;
}

function getCreateToolContentType(
  type: keyof typeof CREATE_TOOL_TYPES
): CreateToolContentType {
  return CREATE_TOOL_TYPES[type];
}

function hasPendingApproval(messages: readonly ChatUIMessage[]): boolean {
  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }
    for (const part of message.parts) {
      if (isToolUIPart(part) && part.state === "approval-requested") {
        return true;
      }
    }
  }
  return false;
}

function isTerminalToolState(state: string): boolean {
  return (
    state === "output-available" ||
    state === "output-error" ||
    state === "output-denied"
  );
}

function hasSendableParts(message: ChatUIMessage): boolean {
  return Array.isArray(message.parts) && message.parts.length > 0;
}

function normalizeToolApprovalsForSend(
  messages: ChatUIMessage[]
): ChatUIMessage[] {
  return messages.map((message) => {
    if (!Array.isArray(message.parts)) {
      return message;
    }

    let changed = false;
    const parts = message.parts.map((part) => {
      if (
        isToolUIPart(part) &&
        part.state === "approval-responded" &&
        part.approval.approved === false &&
        (part.approval.reason === "discard" || part.approval.reason == null)
      ) {
        changed = true;
        return {
          ...part,
          approval: {
            ...part.approval,
            approved: false,
          },
          state: "output-denied" as const,
        } as ChatUIMessage["parts"][number];
      }

      return part;
    });

    return changed ? { ...message, parts } : message;
  }) as ChatUIMessage[];
}

function getSendableMessages(messages: ChatUIMessage[]): ChatUIMessage[] {
  return normalizeToolApprovalsForSend(messages).filter(hasSendableParts);
}

function shouldContinueAfterApprovalResponse({
  messages,
}: {
  messages: ChatUIMessage[];
}): boolean {
  const message = messages.at(-1);

  if (!message || message.role !== "assistant") {
    return false;
  }

  const lastStepStartIndex = message.parts.reduce((lastIndex, part, index) => {
    return part.type === "step-start" ? index : lastIndex;
  }, -1);

  const toolParts = message.parts
    .slice(lastStepStartIndex + 1)
    .filter(isToolUIPart);

  const approvalResponses = toolParts.filter(
    (part) => part.state === "approval-responded"
  );

  return (
    approvalResponses.length > 0 &&
    approvalResponses.every((part) => part.approval.approved) &&
    toolParts.every(
      (part) =>
        part.state === "output-available" ||
        part.state === "output-error" ||
        part.state === "approval-responded"
    )
  );
}

function ChatImageAttachment({
  url,
  filename,
  mediaType,
  onClick,
}: ChatImageAttachmentProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="my-1 inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-muted-foreground text-xs">
        <span className="truncate">
          {filename ?? mediaType ?? "Attachment"} is unavailable
        </span>
      </div>
    );
  }

  return (
    <button
      className="my-1 block w-fit overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      type="button"
    >
      <Image
        alt={filename ?? "attachment"}
        className="block h-auto max-h-72 w-auto max-w-full"
        height={480}
        loading="eager"
        onError={() => setHasError(true)}
        src={url}
        unoptimized
        width={640}
      />
    </button>
  );
}

function StandaloneChatPageClient({
  organizationSlug,
  chatId: initialChatId,
}: StandaloneChatPageClientProps) {
  const router = useRouter();
  const [initialQuery, setInitialQuery] = useQueryState(
    "q",
    parseAsString.withOptions({ history: "replace" })
  );
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [generatedChatId, setGeneratedChatId] = useState(() =>
    crypto.randomUUID()
  );
  const stableChatId = initialChatId ?? generatedChatId;

  const [context, setContext] = useState<ContextItem[]>([]);
  const [hasCustomizedContext, setHasCustomizedContext] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    filename: string;
    mediaType: string;
  } | null>(null);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_CHAT_PREFERENCES.model
  );
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(
    DEFAULT_CHAT_PREFERENCES.thinkingLevel
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageBranches, setMessageBranches] = useState<
    Record<string, { tails: ChatUIMessage[][]; active: number }>
  >({});
  const chatInputRef = useRef<ChatInputHandle | null>(null);
  const [isInputEmpty, setIsInputEmpty] = useState(true);

  const handleSuggestionSelect = useCallback((text: string) => {
    chatInputRef.current?.setText(text);
  }, []);

  const contextRef = useRef(context);
  const hasCustomizedContextRef = useRef(hasCustomizedContext);
  const organizationIdRef = useRef(organizationId);
  const selectedModelRef = useRef(selectedModel);
  const thinkingLevelRef = useRef(thinkingLevel);

  useEffect(() => {
    contextRef.current = context;
    hasCustomizedContextRef.current = hasCustomizedContext;
    selectedModelRef.current = selectedModel;
    thinkingLevelRef.current = thinkingLevel;
    organizationIdRef.current = organizationId;
  }, [
    context,
    hasCustomizedContext,
    selectedModel,
    thinkingLevel,
    organizationId,
  ]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: `/api/organizations/${organizationId}/chat`,
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            chatId: id,
            messages: getSendableMessages(messages),
            context: hasCustomizedContextRef.current
              ? contextRef.current
              : undefined,
            model: selectedModelRef.current,
            enableThinking: thinkingLevelRef.current !== "off",
            thinkingLevel: thinkingLevelRef.current,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
        prepareReconnectToStreamRequest: ({ id }) => ({
          api: `/api/organizations/${organizationIdRef.current}/chat/${id}/stream`,
          headers: { "x-chat-reconnect": "true" },
        }),
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers);

          if (headers.get("x-chat-reconnect") === "true") {
            return fetch(input, init);
          }

          const parsedRequestBody = chatTransportRequestInputSchema.safeParse(
            init?.body
          );
          const requestBody = parsedRequestBody.success
            ? parsedRequestBody.data
            : null;

          const latestMessageId = requestBody?.messages.at(-1)?.id;

          if (latestMessageId) {
            setPendingMessageId(latestMessageId);
          }

          const triggerResponse = await fetch(input, init);
          if (!triggerResponse.ok) {
            return triggerResponse;
          }

          const contentType = triggerResponse.headers.get("content-type") ?? "";
          if (contentType.includes("text/event-stream")) {
            return triggerResponse;
          }

          if (!requestBody) {
            return triggerResponse;
          }

          return fetch(
            `/api/organizations/${organizationIdRef.current}/chat/${requestBody.chatId}/stream`,
            {
              method: "GET",
              headers: init?.headers,
              credentials: init?.credentials,
              signal: init?.signal,
            }
          );
        },
      }),
    [organizationId]
  );

  const [wasStoppedByUser, setWasStoppedByUser] = useState(false);
  const wasStoppedByUserRef = useRef(false);

  const drainQueueRef = useRef<() => void>(() => {
    // Populated after dispatchMessage is defined below.
  });

  const handleFinish = useCallback(
    ({ message }: { message: ChatUIMessage }) => {
      const pinnedModel = getPinnedModelFromAutoMetadata(message.metadata);
      if (pinnedModel) {
        selectedModelRef.current = pinnedModel;
        setSelectedModel(pinnedModel);
      }

      setPendingMessageId(null);
      queryClient.invalidateQueries({ queryKey: ["autumn", "customer"] });
      queryClient.invalidateQueries({
        queryKey: ["chat-sessions", organizationId],
      });
      isDrainingRef.current = false;
      drainQueueRef.current();
    },
    [organizationId, queryClient]
  );

  const {
    messages,
    setMessages,
    sendMessage,
    addToolApprovalResponse,
    status,
    stop,
  } = useChat<ChatUIMessage>({
    id: stableChatId,
    resume: Boolean(initialChatId && pendingMessageId),
    experimental_throttle: 90,
    transport,
    sendAutomaticallyWhen: shouldContinueAfterApprovalResponse,
    onFinish: handleFinish,
    onError: (err) =>
      handleStandaloneChatError(err, { setChatError, setPendingMessageId }),
  });

  const [isStopping, setIsStopping] = useState(false);

  const handleModelChange = useCallback((model: string) => {
    const nextModel = parseStoredChatModel(model);
    if (!nextModel) {
      return;
    }

    setSelectedModel(nextModel);
  }, []);

  const handleThinkingLevelChange = useCallback((level: ThinkingLevel) => {
    const nextThinkingLevel = parseStoredThinkingLevel(level);
    if (!nextThinkingLevel) {
      return;
    }

    setThinkingLevel(nextThinkingLevel);
  }, []);

  useEffect(() => {
    if (initialChatId) {
      return;
    }

    function syncChatPreferencesFromStorage() {
      const storedPreferences = readStoredChatPreferences();
      if (!storedPreferences) {
        return;
      }

      setSelectedModel(storedPreferences.model);
      setThinkingLevel(storedPreferences.thinkingLevel);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== CHAT_PREFERENCES_STORAGE_KEY) {
        return;
      }

      syncChatPreferencesFromStorage();
    }

    syncChatPreferencesFromStorage();
    window.addEventListener("focus", syncChatPreferencesFromStorage);
    window.addEventListener("storage", handleStorage);
    document.addEventListener(
      "visibilitychange",
      syncChatPreferencesFromStorage
    );

    return () => {
      window.removeEventListener("focus", syncChatPreferencesFromStorage);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener(
        "visibilitychange",
        syncChatPreferencesFromStorage
      );
    };
  }, [initialChatId]);

  useEffect(() => {
    if (initialChatId) {
      return;
    }

    writeStoredChatPreferences({
      model: selectedModel,
      thinkingLevel,
    });
  }, [initialChatId, selectedModel, thinkingLevel]);

  const stopActiveResponse = useCallback(async () => {
    try {
      if (organizationId && stableChatId) {
        await fetch(
          `/api/organizations/${organizationId}/chat/${encodeURIComponent(stableChatId)}/stop`,
          { method: "POST" }
        );
      }
    } catch (stopError) {
      console.error("[Chat] Failed to notify server to stop:", stopError);
    }
    stop();
  }, [organizationId, stableChatId, stop]);

  const handleStop = useCallback(async () => {
    setIsStopping(true);
    updateWasStoppedByUser(true, wasStoppedByUserRef, setWasStoppedByUser);
    await stopActiveResponse();
  }, [stopActiveResponse]);

  const {
    data: chatHistoryData,
    isLoading: isChatHistoryLoading,
    isPending: isChatHistoryPending,
  } = useQuery<{
    messages: ChatUIMessage[] | null;
    lastResponseStopped: boolean;
    activeStreamId: string | null;
  } | null>({
    queryKey: ["chat-history", organizationId, initialChatId],
    queryFn: async () => {
      if (!initialChatId) {
        return null;
      }
      const res = await fetch(
        `/api/organizations/${organizationId}/chat/${encodeURIComponent(initialChatId)}`
      );
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return {
        messages: data?.messages ?? null,
        lastResponseStopped: Boolean(data?.lastResponseStopped),
        activeStreamId:
          typeof data?.activeStreamId === "string" ? data.activeStreamId : null,
      };
    },
    enabled: Boolean(initialChatId) && Boolean(organizationId),
    staleTime: 1000 * 60 * 5,
  });

  useLayoutEffect(() => {
    if (!chatHistoryData) {
      return;
    }
    const historyMessages = chatHistoryData.messages;
    if (historyMessages?.length) {
      setMessages(historyMessages);

      let modelRestored = false;
      let thinkingLevelRestored = false;

      for (let index = historyMessages.length - 1; index >= 0; index -= 1) {
        if (modelRestored && thinkingLevelRestored) {
          break;
        }

        const metadata = historyMessages[index]?.metadata;
        if (!metadata) {
          continue;
        }

        if (!modelRestored) {
          const modelToRestore =
            metadata.requestedModel === "auto"
              ? metadata.model
              : (metadata.requestedModel ?? metadata.model);
          if (modelToRestore) {
            const parsedModel = parseStoredChatModel(modelToRestore);
            if (parsedModel) {
              setSelectedModel(parsedModel);
              modelRestored = true;
            }
          }
        }

        if (!thinkingLevelRestored) {
          const thinkingLevelToRestore =
            metadata.requestedThinkingLevel ??
            (metadata.requestedModel && metadata.requestedModel !== "auto"
              ? metadata.thinkingLevel
              : undefined);

          if (thinkingLevelToRestore) {
            const parsedThinkingLevel = parseStoredThinkingLevel(
              thinkingLevelToRestore
            );
            if (parsedThinkingLevel) {
              setThinkingLevel(parsedThinkingLevel);
              thinkingLevelRestored = true;
            }
          }
        }
      }
    }
    updateWasStoppedByUser(
      Boolean(chatHistoryData.lastResponseStopped),
      wasStoppedByUserRef,
      setWasStoppedByUser
    );
    if (chatHistoryData.activeStreamId) {
      setPendingMessageId(chatHistoryData.activeStreamId);
    } else {
      setPendingMessageId(null);
    }
  }, [chatHistoryData, setMessages]);

  const hasUpdatedUrlRef = useRef(false);
  const hasRunInitialChatIdEffectRef = useRef(false);

  useEffect(() => {
    if (!hasRunInitialChatIdEffectRef.current) {
      hasRunInitialChatIdEffectRef.current = true;
      return;
    }

    setPendingMessageId(null);
    setChatError(null);
    setQueuedMessages([]);

    if (initialChatId) {
      return;
    }

    hasUpdatedUrlRef.current = false;
    updateWasStoppedByUser(false, wasStoppedByUserRef, setWasStoppedByUser);
    setMessages([]);
    setContext([]);
    setHasCustomizedContext(false);
    setGeneratedChatId(crypto.randomUUID());
  }, [initialChatId, setMessages]);

  const draftStorageKey = localStorageKeys.chatDraft(
    initialChatId ?? `new:${organizationSlug}`
  );
  const queueStorageKey = localStorageKeys.chatQueue(stableChatId);
  const loadedQueueKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedQueueKeyRef.current === queueStorageKey) {
      return;
    }
    loadedQueueKeyRef.current = queueStorageKey;
    try {
      const raw = window.localStorage.getItem(queueStorageKey);
      if (!raw) {
        setQueuedMessages([]);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setQueuedMessages([]);
        return;
      }
      const restored = parsed.filter(
        (m): m is QueuedMessage =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as { id?: unknown }).id === "string" &&
          typeof (m as { text?: unknown }).text === "string"
      );
      setQueuedMessages(restored);
    } catch {
      setQueuedMessages([]);
    }
  }, [queueStorageKey]);

  useEffect(() => {
    if (loadedQueueKeyRef.current !== queueStorageKey) {
      return;
    }
    try {
      if (queuedMessages.length === 0) {
        window.localStorage.removeItem(queueStorageKey);
      } else {
        window.localStorage.setItem(
          queueStorageKey,
          JSON.stringify(queuedMessages)
        );
      }
    } catch {
      // noop
    }
  }, [queueStorageKey, queuedMessages]);

  const pendingHistoryMessages = chatHistoryData?.messages?.length ?? 0;
  const isLoadingHistory =
    Boolean(initialChatId) &&
    messages.length === 0 &&
    (isChatHistoryLoading ||
      isChatHistoryPending ||
      pendingHistoryMessages > 0);
  const isLoading = status === "streaming" || status === "submitted";
  const isPendingAutoSubmit =
    !initialChatId && Boolean(initialQuery?.trim()) && messages.length === 0;
  const hasMessages = messages.length > 0;

  const [isFirstMessageTransition, setIsFirstMessageTransition] =
    useState(false);
  const firstMessageTransitionTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const triggerFirstMessageTransition = useCallback(() => {
    if (firstMessageTransitionTimerRef.current) {
      clearTimeout(firstMessageTransitionTimerRef.current);
    }
    setIsFirstMessageTransition(true);
    firstMessageTransitionTimerRef.current = setTimeout(() => {
      setIsFirstMessageTransition(false);
      firstMessageTransitionTimerRef.current = null;
    }, 600);
  }, []);
  useEffect(
    () => () => {
      if (firstMessageTransitionTimerRef.current) {
        clearTimeout(firstMessageTransitionTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return target.isContentEditable;
    }

    function handleAutoFocus(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key.length !== 1) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      chatInputRef.current?.focus();
    }

    window.addEventListener("keydown", handleAutoFocus);
    return () => {
      window.removeEventListener("keydown", handleAutoFocus);
    };
  }, []);

  const handleAddContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) => {
      const exists = prev.some((c) => {
        if (c.type !== item.type) {
          return false;
        }
        if (c.type === "github-repo" && item.type === "github-repo") {
          return c.owner === item.owner && c.repo === item.repo;
        }
        return c.integrationId === item.integrationId;
      });
      if (exists) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveContext = useCallback((item: ContextItem) => {
    setHasCustomizedContext(true);
    setContext((prev) =>
      prev.filter((c) => {
        if (c.type !== item.type) {
          return true;
        }
        if (c.type === "github-repo" && item.type === "github-repo") {
          return !(c.owner === item.owner && c.repo === item.repo);
        }
        return c.integrationId !== item.integrationId;
      })
    );
  }, []);

  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const extractUserMessageContent = useCallback((message: ChatUIMessage) => {
    let text = "";
    const attachments: ChatMessagePart[] = [];
    for (const part of message.parts) {
      if (part.type === "text") {
        text += part.text;
      } else if (part.type === "file") {
        attachments.push({
          type: "file",
          url: part.url,
          mediaType: part.mediaType,
          filename: part.filename,
        });
      }
    }
    return { text, attachments };
  }, []);

  const getUserMessageText = useCallback(
    (message: ChatUIMessage) => extractUserMessageContent(message).text,
    [extractUserMessageContent]
  );

  const toDisplayText = useCallback((serialized: string) => {
    return serialized.replace(
      /@?integration\/(?:github\/[^/\s]+\/[^/\s]+\/[^/\s]+|linear\/[^/\s]+)/g,
      (match) => {
        const item = parseReferenceValue(match);
        return item ? getReferenceDisplay(item) : match;
      }
    );
  }, []);

  const handleStartEditMessage = useCallback((messageId: string) => {
    setEditingMessageId(messageId);
  }, []);

  const handleCancelEditMessage = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const resendFromUserMessage = useCallback(
    async (
      userMessageId: string,
      text: string,
      attachments: ChatMessagePart[],
      modelOverride?: string
    ) => {
      const current = messagesRef.current;
      const index = current.findIndex((m) => m.id === userMessageId);
      if (index === -1) {
        return;
      }

      const currentTail = current.slice(index);
      const truncated = current.slice(0, index + 1);

      setMessageBranches((prev) => {
        const existing = prev[userMessageId];
        if (!existing) {
          return {
            ...prev,
            [userMessageId]: { tails: [currentTail, []], active: 1 },
          };
        }
        const tails = [...existing.tails];
        tails[existing.active] = currentTail;
        tails.push([]);
        return {
          ...prev,
          [userMessageId]: { tails, active: tails.length - 1 },
        };
      });

      if (modelOverride) {
        const parsed = parseStoredChatModel(modelOverride);
        if (parsed) {
          selectedModelRef.current = parsed;
          setSelectedModel(parsed);
        }
      }

      setMessages(truncated);
      setIsStopping(false);
      updateWasStoppedByUser(false, wasStoppedByUserRef, setWasStoppedByUser);
      setChatError(null);
      if (attachments.length > 0) {
        const parts: ChatMessagePart[] = [];
        if (text.length > 0) {
          parts.push({ type: "text", text });
        }
        parts.push(...attachments);
        await sendMessage({ role: "user", parts, messageId: userMessageId });
      } else {
        await sendMessage({ text, messageId: userMessageId });
      }
    },
    [sendMessage, setMessages]
  );

  const handleEditMessage = useCallback(
    async (userMessageId: string, newText: string) => {
      setEditingMessageId(null);
      const current = messagesRef.current;
      const message = current.find((m) => m.id === userMessageId);
      const attachments = message
        ? extractUserMessageContent(message).attachments
        : [];
      await resendFromUserMessage(userMessageId, newText, attachments);
    },
    [extractUserMessageContent, resendFromUserMessage]
  );

  const handleRetryMessage = useCallback(
    async (userMessageId: string, modelOverride?: string) => {
      const current = messagesRef.current;
      const message = current.find((m) => m.id === userMessageId);
      if (!message) {
        return;
      }
      const { text, attachments } = extractUserMessageContent(message);
      if (!text.trim() && attachments.length === 0) {
        return;
      }
      await resendFromUserMessage(
        userMessageId,
        text,
        attachments,
        modelOverride
      );
    },
    [extractUserMessageContent, resendFromUserMessage]
  );

  const [branchSwitchSignal, setBranchSwitchSignal] = useState<{
    userMessageId: string;
    tick: number;
  } | null>(null);

  const handleSwitchBranch = useCallback(
    (userMessageId: string, direction: "prev" | "next") => {
      const existing = messageBranches[userMessageId];
      if (!existing || existing.tails.length <= 1) {
        return;
      }
      const current = messagesRef.current;
      const index = current.findIndex((m) => m.id === userMessageId);
      if (index === -1) {
        return;
      }
      const before = current.slice(0, index);
      const currentTail = current.slice(index);

      const tails = [...existing.tails];
      tails[existing.active] = currentTail;
      const total = tails.length;
      const active =
        direction === "next"
          ? (existing.active + 1) % total
          : (existing.active - 1 + total) % total;

      setMessageBranches((prev) => ({
        ...prev,
        [userMessageId]: { tails, active },
      }));
      setMessages([...before, ...(tails[active] ?? [])]);

      setBranchSwitchSignal({ userMessageId, tick: Date.now() });
    },
    [messageBranches, setMessages]
  );

  const dispatchMessage = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      if (text.trim().length === 0 && attachments.length === 0) {
        return;
      }

      const isFirstMessage = !initialChatId && !hasUpdatedUrlRef.current;
      if (messagesRef.current.length === 0) {
        triggerFirstMessageTransition();
      }
      setIsStopping(false);
      updateWasStoppedByUser(false, wasStoppedByUserRef, setWasStoppedByUser);
      for (const message of messagesRef.current) {
        if (message.role !== "assistant") {
          continue;
        }
        for (const part of message.parts) {
          if (!(isToolUIPart(part) && part.state === "approval-requested")) {
            continue;
          }
          const approvalId = part.approval?.id;
          if (!approvalId) {
            continue;
          }
          addToolApprovalResponse({
            id: approvalId,
            approved: false,
          });
        }
      }
      if (isFirstMessage) {
        hasUpdatedUrlRef.current = true;
        window.history.replaceState(
          null,
          "",
          `/${organizationSlug}/chat/${stableChatId}`
        );
      }
      if (attachments.length > 0) {
        const parts: ChatMessagePart[] = [];
        if (text.length > 0) {
          parts.push({ type: "text", text });
        }
        for (const attachment of attachments) {
          parts.push({
            type: "file",
            url: attachment.url,
            mediaType: attachment.mediaType,
            filename: attachment.filename,
          });
        }
        await sendMessage({ role: "user", parts });
      } else {
        await sendMessage({ text });
      }
      if (isFirstMessage) {
        queryClient.setQueryData(
          ["chat-history", organizationId, stableChatId],
          {
            messages: messagesRef.current,
            lastResponseStopped: wasStoppedByUserRef.current,
            activeStreamId: null,
          }
        );
        router.replace(`/${organizationSlug}/chat/${stableChatId}`, {
          scroll: false,
        });
        queryClient.invalidateQueries({
          queryKey: ["chat-sessions", organizationId],
        });
      }
    },
    [
      addToolApprovalResponse,
      initialChatId,
      organizationId,
      organizationSlug,
      queryClient,
      router,
      sendMessage,
      stableChatId,
      triggerFirstMessageTransition,
    ]
  );

  const handleSend = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      if (isLoading) {
        if (attachments.length > 0) {
          return;
        }
        setQueuedMessages((prev) => [...prev, { id: nanoid(10), text }]);
        return;
      }
      await dispatchMessage(text, attachments);
    },
    [dispatchMessage, isLoading]
  );

  const autoSubmittedQueryRef = useRef<string | null>(null);
  const pendingInitialQueryResetRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialChatId) {
      return;
    }
    const trimmedInitialQuery = initialQuery?.trim();
    if (!trimmedInitialQuery) {
      autoSubmittedQueryRef.current = null;
      pendingInitialQueryResetRef.current = null;
      return;
    }
    if (autoSubmittedQueryRef.current === trimmedInitialQuery) {
      return;
    }
    if (!organizationId) {
      return;
    }
    if (messagesRef.current.length > 0) {
      if (pendingInitialQueryResetRef.current === trimmedInitialQuery) {
        return;
      }
      pendingInitialQueryResetRef.current = trimmedInitialQuery;
      setPendingMessageId(null);
      setChatError(null);
      setQueuedMessages([]);
      hasUpdatedUrlRef.current = false;
      updateWasStoppedByUser(false, wasStoppedByUserRef, setWasStoppedByUser);
      setMessages([]);
      setContext([]);
      setHasCustomizedContext(false);
      setGeneratedChatId(crypto.randomUUID());
      return;
    }

    const queryToSubmit = trimmedInitialQuery;
    let cancelled = false;
    let attempts = 0;

    function submitWhenComposerIsReady() {
      if (cancelled) {
        return;
      }

      const chatInput = chatInputRef.current;
      if (!chatInput) {
        attempts += 1;
        if (attempts < 10) {
          window.requestAnimationFrame(submitWhenComposerIsReady);
        }
        return;
      }

      autoSubmittedQueryRef.current = queryToSubmit;
      pendingInitialQueryResetRef.current = null;
      chatInput.setText(queryToSubmit);
      window.requestAnimationFrame(() => {
        chatInput.submit();
        setInitialQuery(null);
      });
    }

    submitWhenComposerIsReady();

    return () => {
      cancelled = true;
    };
  }, [
    initialChatId,
    initialQuery,
    organizationId,
    setInitialQuery,
    setMessages,
  ]);

  const handleRemoveQueued = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleEditQueued = useCallback((message: QueuedMessage) => {
    setQueuedMessages((prev) => prev.filter((m) => m.id !== message.id));
    chatInputRef.current?.setText(message.text);
  }, []);

  const handleUpdateQueued = useCallback((id: string, text: string) => {
    setQueuedMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text } : m))
    );
  }, []);

  const queuedMessagesRef = useRef(queuedMessages);

  useEffect(() => {
    queuedMessagesRef.current = queuedMessages;
  }, [queuedMessages]);

  const isDrainingRef = useRef(false);
  const seenToolOutputsRef = useRef<Set<string>>(new Set());
  const prevIsLoadingRef = useRef(false);

  useEffect(() => {
    drainQueueRef.current = () => {
      if (isDrainingRef.current) {
        return;
      }
      if (wasStoppedByUserRef.current) {
        return;
      }
      if (hasPendingApproval(messagesRef.current)) {
        return;
      }
      const queue = queuedMessagesRef.current;
      const next = queue[0];
      if (!next) {
        return;
      }

      isDrainingRef.current = true;
      setQueuedMessages(queue.slice(1));
      dispatchMessage(next.text).catch((error) => {
        console.error("[Chat] Failed to drain queued message:", error);
        isDrainingRef.current = false;
        setQueuedMessages((prev) => [next, ...prev]);
      });
    };
  }, [dispatchMessage]);

  useEffect(() => {
    if (isLoading && !prevIsLoadingRef.current) {
      const snapshot = new Set<string>();
      for (const message of messagesRef.current) {
        if (message.role !== "assistant") {
          continue;
        }
        for (const part of message.parts) {
          if (isToolUIPart(part) && isTerminalToolState(part.state)) {
            snapshot.add(part.toolCallId);
          }
        }
      }
      seenToolOutputsRef.current = snapshot;
      isDrainingRef.current = false;
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    if (isDrainingRef.current) {
      return;
    }
    if (wasStoppedByUser) {
      return;
    }
    if (queuedMessages.length === 0) {
      return;
    }
    if (hasPendingApproval(messages)) {
      return;
    }

    let hasNewToolOutput = false;
    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }
      for (const part of message.parts) {
        if (
          isToolUIPart(part) &&
          isTerminalToolState(part.state) &&
          !seenToolOutputsRef.current.has(part.toolCallId)
        ) {
          seenToolOutputsRef.current.add(part.toolCallId);
          hasNewToolOutput = true;
        }
      }
    }

    if (!hasNewToolOutput) {
      return;
    }

    isDrainingRef.current = true;

    stopActiveResponse().catch((error) => {
      console.error(
        "[Chat] Failed to stop active response for queue drain:",
        error
      );
      isDrainingRef.current = false;
    });
  }, [
    isLoading,
    messages,
    queuedMessages.length,
    wasStoppedByUser,
    stopActiveResponse,
  ]);

  useEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key.length !== 1) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      chatInputRef.current?.focus();
    }

    window.addEventListener("keydown", handleGlobalKeydown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, []);

  const handleClearError = useCallback(() => setChatError(null), []);

  const handleRetryAfterError = useCallback(async () => {
    let lastUserMessage: ChatUIMessage | undefined;
    for (const message of messagesRef.current) {
      if (message.role === "user") {
        lastUserMessage = message;
      }
    }
    if (!lastUserMessage) {
      return;
    }
    setChatError(null);
    await handleRetryMessage(lastUserMessage.id);
  }, [handleRetryMessage]);

  function renderPart(
    part: ChatUIMessage["parts"][number],
    messageId: string,
    index: number
  ) {
    if (part.type === "text") {
      const text = part.text as string;
      if (!text.trim()) {
        return null;
      }

      const hasInlineReference =
        text.includes("integration/github/") ||
        text.includes("integration/linear/");

      if (hasInlineReference) {
        return (
          <div
            className="wrap-break-word size-full whitespace-pre-wrap"
            key={`${messageId}-text-${index}`}
          >
            {renderTextWithIntegrationReferences(text)}
          </div>
        );
      }

      return (
        <MessageResponse key={`${messageId}-text-${index}`}>
          {text}
        </MessageResponse>
      );
    }

    if (part.type === "file") {
      const url = typeof part.url === "string" ? part.url : "";
      const mediaType =
        typeof part.mediaType === "string" ? part.mediaType : "";
      const filename =
        typeof part.filename === "string" ? part.filename : undefined;
      if (!url) {
        return null;
      }
      const fileKey = `${messageId}-file-${index}`;
      if (isImageMimeType(mediaType)) {
        return (
          <ChatImageAttachment
            filename={filename}
            key={fileKey}
            mediaType={mediaType}
            onClick={() =>
              setPreviewAttachment({
                url,
                filename: filename ?? "attachment",
                mediaType,
              })
            }
            url={url}
          />
        );
      }
      return (
        <a
          className="my-1 inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-foreground text-xs no-underline transition-colors hover:bg-accent"
          href={url}
          key={fileKey}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="truncate">
            {filename ?? mediaType ?? "Attachment"}
          </span>
        </a>
      );
    }

    if (part.type === "reasoning") {
      const text = part.text as string;
      if (!text) {
        return null;
      }
      const reasoningKey = `${messageId}-reasoning-${index}`;
      const reasoningState = part.state as "streaming" | "done" | undefined;
      return (
        <ChatReasoningBlock
          isStreaming={isLoading && reasoningState === "streaming"}
          key={reasoningKey}
        >
          {text}
        </ChatReasoningBlock>
      );
    }

    if (isToolUIPart(part)) {
      const toolPart = part as RenderableToolPart;
      const toolName = getToolName(toolPart);
      const staticToolType =
        toolPart.type === "dynamic-tool" ? null : toolPart.type;

      if (staticToolType && isCreateTool(staticToolType)) {
        const contentType = getCreateToolContentType(
          staticToolType as keyof typeof CREATE_TOOL_TYPES
        );
        const input = toolPart.input as
          | { title?: string; markdown?: string }
          | undefined;
        const title = input?.title ?? "Untitled";
        const markdown = input?.markdown ?? "";

        if (
          toolPart.state === "input-streaming" ||
          toolPart.state === "input-available"
        ) {
          return <CreateToolPendingIndicator key={toolPart.toolCallId} />;
        }

        if (toolPart.state === "output-error") {
          return (
            <div
              className="flex w-fit items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs"
              key={toolPart.toolCallId}
            >
              <HugeiconsIcon className="size-3.5" icon={X} />
              <span>Draft generation failed. The assistant will retry.</span>
            </div>
          );
        }

        if (toolPart.state === "output-denied") {
          return null;
        }

        if (toolPart.approval?.reason === "discard") {
          return null;
        }

        const previewState: "draft" | "finished" =
          toolPart.state === "output-available" ||
          toolPart.approval?.reason === "manual-draft" ||
          toolPart.approval?.reason === "manual-published"
            ? "finished"
            : "draft";
        const persistedStatus: "draft" | "published" =
          toolPart.approval?.reason === "manual-published"
            ? "published"
            : "draft";

        const approvalId = toolPart.approval?.id;
        const handleApprove = approvalId
          ? () =>
              addToolApprovalResponse({
                id: approvalId,
                approved: true,
              })
          : undefined;
        const handleDeny = approvalId
          ? () =>
              addToolApprovalResponse({
                id: approvalId,
                approved: false,
                reason: "discard",
              })
          : undefined;
        const handlePersist = approvalId
          ? async (
              status: "draft" | "published",
              payload: { title: string; markdown: string }
            ) => {
              const response = await fetch(
                `/api/organizations/${organizationId}/chat/posts`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...payload,
                    chatId: stableChatId,
                    contentType,
                    status,
                  }),
                }
              );
              if (!response.ok) {
                throw new Error("Failed to save post");
              }
              try {
                await addToolApprovalResponse({
                  id: approvalId,
                  approved: false,
                  reason:
                    status === "published"
                      ? "manual-published"
                      : "manual-draft",
                });
              } catch (error) {
                console.error(
                  "[Chat] Failed to mark persisted post approval:",
                  error
                );
              }
              queryClient.invalidateQueries({
                queryKey: ["chat-sessions", organizationId],
              });
            }
          : undefined;
        const handleRegenerate = approvalId
          ? async (
              instructions: string,
              payload: { title: string; markdown: string }
            ) => {
              await addToolApprovalResponse({
                id: approvalId,
                approved: false,
                reason: "discard",
              });
              sendMessage({
                text: `Regenerate the ${getOutputTypeLabel(contentType)} with these changes: ${instructions}\n\nCurrent title: ${payload.title}\n\nCurrent draft:\n${payload.markdown}`,
              });
            }
          : undefined;

        if (contentType === "twitter_post") {
          return (
            <TwitterPreview
              key={toolPart.toolCallId}
              markdown={markdown}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onPersist={handlePersist}
              onRegenerate={handleRegenerate}
              organization={{
                name: organization?.name ?? "Your Name",
                logo: organization?.logo ?? null,
              }}
              persistedStatus={persistedStatus}
              state={previewState}
              title={title}
            />
          );
        }

        if (contentType === "linkedin_post") {
          return (
            <LinkedInPreview
              key={toolPart.toolCallId}
              markdown={markdown}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onPersist={handlePersist}
              onRegenerate={handleRegenerate}
              organization={{
                name: organization?.name ?? "Your Name",
                logo: organization?.logo ?? null,
              }}
              persistedStatus={persistedStatus}
              state={previewState}
              title={title}
            />
          );
        }

        return (
          <BlogChangelogPreview
            contentType={contentType}
            key={toolPart.toolCallId}
            markdown={markdown}
            onApprove={handleApprove}
            onDeny={handleDeny}
            onPersist={handlePersist}
            onRegenerate={handleRegenerate}
            persistedStatus={persistedStatus}
            state={previewState}
            title={title}
          />
        );
      }

      if (
        toolPart.state === "input-streaming" ||
        toolPart.state === "input-available" ||
        toolPart.state === "approval-requested" ||
        toolPart.state === "output-available" ||
        toolPart.state === "output-error"
      ) {
        const approvalId =
          toolPart.state === "approval-requested"
            ? toolPart.approval.id
            : undefined;
        const handleApprove = approvalId
          ? () =>
              addToolApprovalResponse({
                id: approvalId,
                approved: true,
              })
          : undefined;
        const handleDeny = approvalId
          ? () =>
              addToolApprovalResponse({
                id: approvalId,
                approved: false,
              })
          : undefined;
        const output =
          toolPart.state === "output-error"
            ? { error: toolPart.errorText }
            : toolPart.output;

        return (
          <ChatToolBlock
            input={toolPart.input}
            isMcp={toolName.startsWith("mcp_")}
            key={toolPart.toolCallId}
            onApprove={handleApprove}
            onDeny={handleDeny}
            output={output}
            state={toolPart.state}
            toolMetadata={
              toolPart.type === "dynamic-tool"
                ? toolPart.toolMetadata
                : undefined
            }
            toolName={toolName}
          />
        );
      }

      return null;
    }

    return null;
  }

  if (isLoadingHistory) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative flex min-h-full min-w-0 flex-col">
            <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
              <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6">
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-64 rounded-2xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/6" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 z-10 bg-background px-4 pb-4">
              <div className="-inset-x-4 pointer-events-none absolute bottom-full h-12 bg-linear-to-t from-background to-transparent" />
              <div className="mx-auto w-full max-w-2xl">
                <ChatInputAdvanced
                  context={context}
                  error={chatError}
                  isLoading={isLoading}
                  isStopping={isStopping}
                  model={selectedModel}
                  onAddContext={handleAddContext}
                  onClearError={handleClearError}
                  onModelChange={handleModelChange}
                  onRemoveContext={handleRemoveContext}
                  onSend={handleSend}
                  onStop={handleStop}
                  onThinkingLevelChange={handleThinkingLevelChange}
                  organizationId={organizationId}
                  organizationSlug={organizationSlug}
                  thinkingLevel={thinkingLevel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!(hasMessages || isPendingAutoSubmit || isLoading)) {
    const now = isHydrated ? new Date() : null;
    const greeting = now ? getGreeting(now) : "Welcome";
    const userName = session?.user?.name?.split(" ")[0];
    const dateStr = now ? formatLongDate(now) : "\u00A0";

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{dateStr}</p>
            <h1 className="font-semibold text-2xl tracking-tight">
              {greeting}
              {userName ? `, ${userName}` : ""}
            </h1>
          </div>
          <div className="w-full">
            <ChatInputAdvanced
              context={context}
              draftStorageKey={draftStorageKey}
              error={chatError}
              initialValue={initialQuery ?? undefined}
              isLoading={isLoading}
              isStopping={isStopping}
              model={selectedModel}
              onAddContext={handleAddContext}
              onClearError={handleClearError}
              onEmptyChange={setIsInputEmpty}
              onModelChange={handleModelChange}
              onRemoveContext={handleRemoveContext}
              onSend={handleSend}
              onStop={handleStop}
              onThinkingLevelChange={handleThinkingLevelChange}
              onUpdateQueued={handleUpdateQueued}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              queuedMessages={queuedMessages}
              ref={chatInputRef}
              thinkingLevel={thinkingLevel}
            />
          </div>
          <ChatSuggestions
            disabled={isLoading}
            hidden={!isInputEmpty}
            onSelect={handleSuggestionSelect}
          />
        </div>
      </div>
    );
  }

  const lastMessage = messages.at(-1);
  const lastAssistantHasNoVisibleContent =
    lastMessage?.role === "assistant" &&
    !lastMessage.parts.some(
      (p) =>
        (p.type === "text" && p.text.trim()) ||
        p.type === "file" ||
        p.type === "reasoning" ||
        isToolUIPart(p)
    );
  const lastPart = lastMessage?.parts.at(-1);
  const isAwaitingAssistantContinuation =
    lastMessage?.role === "assistant" &&
    lastPart != null &&
    (lastPart.type === "step-start" ||
      (isToolUIPart(lastPart) &&
        (isTerminalToolState(lastPart.state) ||
          lastPart.state === "approval-responded")));
  const showThinkingIndicator =
    isLoading &&
    lastMessage != null &&
    (lastMessage.role === "user" ||
      lastAssistantHasNoVisibleContent ||
      isAwaitingAssistantContinuation);
  const thinkingIndicatorLabel =
    lastMessage?.role === "user" ? "Getting Started" : "Working";
  const visibleMessages =
    showThinkingIndicator && lastAssistantHasNoVisibleContent
      ? messages.slice(0, -1)
      : messages;

  return (
    <>
      <LazyMotion features={loadMotionFeatures} strict>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport className="min-w-0 overflow-x-hidden">
                <MessageScrollerContent className="px-4 pt-6 pb-6">
                  <div
                    className={cn(
                      "mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4",
                      isFirstMessageTransition && "chat-messages-fade-in"
                    )}
                  >
                    {(() => {
                      const branchPointIndex = branchSwitchSignal
                        ? visibleMessages.findIndex(
                            (m) => m.id === branchSwitchSignal.userMessageId
                          )
                        : -1;
                      return visibleMessages.map((message, messageIndex) => {
                        const isUser = message.role === "user";
                        const isEditing =
                          isUser && editingMessageId === message.id;
                        const branches = isUser
                          ? messageBranches[message.id]
                          : undefined;
                        const branchTotal = branches?.tails.length ?? 0;
                        const branchIdx = branches?.active ?? 0;
                        const isDownstreamOfBranchSwitch =
                          branchPointIndex !== -1 &&
                          messageIndex > branchPointIndex;
                        const branchFadeKey = isDownstreamOfBranchSwitch
                          ? `${message.id}-${branchSwitchSignal?.tick}`
                          : message.id;
                        return (
                          <MessageScrollerItem
                            key={branchFadeKey}
                            messageId={message.id}
                            scrollAnchor={isUser}
                          >
                            <Message
                              className={cn(
                                isDownstreamOfBranchSwitch &&
                                  "chat-branch-fade-in"
                              )}
                              from={message.role}
                            >
                              {isUser ? (
                                <m.div
                                  className={cn(
                                    "ml-auto overflow-hidden",
                                    isEditing
                                      ? "w-full"
                                      : "flex w-fit max-w-full"
                                  )}
                                  layout
                                  transition={{
                                    duration: 0.25,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                >
                                  {isEditing ? (
                                    <UserMessageEditor
                                      initialText={toDisplayText(
                                        getUserMessageText(message)
                                      )}
                                      onCancel={handleCancelEditMessage}
                                      onSubmit={(text) =>
                                        handleEditMessage(message.id, text)
                                      }
                                    />
                                  ) : (
                                    <MessageContent>
                                      {message.parts.map((part, index) =>
                                        renderPart(part, message.id, index)
                                      )}
                                    </MessageContent>
                                  )}
                                </m.div>
                              ) : (
                                <MessageContent>
                                  {message.parts.map((part, index) =>
                                    renderPart(part, message.id, index)
                                  )}
                                </MessageContent>
                              )}
                              {isUser && (
                                <UserMessageActions
                                  branchIndex={
                                    branchTotal > 1 ? branchIdx : undefined
                                  }
                                  branchTotal={
                                    branchTotal > 1 ? branchTotal : undefined
                                  }
                                  canInteract={!isLoading}
                                  isEditing={isEditing}
                                  messageText={toDisplayText(
                                    getUserMessageText(message)
                                  )}
                                  onEdit={() =>
                                    handleStartEditMessage(message.id)
                                  }
                                  onNextBranch={() =>
                                    handleSwitchBranch(message.id, "next")
                                  }
                                  onPreviousBranch={() =>
                                    handleSwitchBranch(message.id, "prev")
                                  }
                                  onRetry={(model) =>
                                    handleRetryMessage(message.id, model)
                                  }
                                />
                              )}
                              {message.role === "assistant" && (
                                <AssistantMetadataHover
                                  metadata={message.metadata}
                                />
                              )}
                            </Message>
                          </MessageScrollerItem>
                        );
                      });
                    })()}
                    {wasStoppedByUser && !isLoading && (
                      <div className="flex w-fit items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
                        <HugeiconsIcon className="size-3.5" icon={X} />
                        <span>Response stopped by user</span>
                      </div>
                    )}
                    {chatError && !isLoading && (
                      <div className="flex w-fit flex-wrap items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-destructive text-xs">
                        <HugeiconsIcon className="size-3.5 shrink-0" icon={X} />
                        <span>{chatError}</span>
                        <button
                          className="inline-flex items-center gap-1 rounded font-medium underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={handleRetryAfterError}
                          type="button"
                        >
                          <HugeiconsIcon
                            className="size-3.5"
                            icon={ArrowReloadHorizontalIcon}
                          />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                    {showThinkingIndicator && (
                      <Message from="assistant">
                        <MessageContent>
                          <BrailleLoader
                            className="text-sm"
                            label={
                              isStopping ? "Stopping" : thinkingIndicatorLabel
                            }
                          />
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
          <div
            className={cn(
              "z-10 bg-background px-4 pb-4",
              isFirstMessageTransition && "chat-input-slide-down"
            )}
          >
            <div className="mx-auto w-full max-w-2xl">
              <ChatQueue
                messages={queuedMessages}
                onEdit={handleEditQueued}
                onRemove={handleRemoveQueued}
              />
              <ChatInputAdvanced
                connectedTop={queuedMessages.length > 0}
                context={context}
                draftStorageKey={draftStorageKey}
                error={null}
                initialValue={initialQuery ?? undefined}
                isLoading={isLoading}
                isStopping={isStopping}
                model={selectedModel}
                onAddContext={handleAddContext}
                onClearError={handleClearError}
                onModelChange={handleModelChange}
                onRemoveContext={handleRemoveContext}
                onSend={handleSend}
                onStop={handleStop}
                onThinkingLevelChange={handleThinkingLevelChange}
                onUpdateQueued={handleUpdateQueued}
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                queuedMessages={queuedMessages}
                ref={chatInputRef}
                thinkingLevel={thinkingLevel}
              />
            </div>
          </div>
        </div>
      </LazyMotion>
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null);
          }
        }}
        open={previewAttachment !== null}
      />
    </>
  );
}

function getPinnedModelFromAutoMetadata(
  metadata: ChatUIMessage["metadata"] | undefined
) {
  if (metadata?.requestedModel !== "auto" || !metadata.model) {
    return null;
  }

  const parsedModel = parseStoredChatModel(metadata.model);
  return parsedModel && parsedModel !== "auto" ? parsedModel : null;
}

export default function PageClient(props: StandaloneChatPageClientProps) {
  return (
    <StandaloneChatPageClient
      chatId={props.chatId}
      key={props.chatId ?? "__new"}
      organizationSlug={props.organizationSlug}
    />
  );
}
