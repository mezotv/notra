"use client";

import { useChat } from "@ai-sdk/react";
import { AiBrain01Icon, ArrowDown01Icon, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  chatErrorPayloadSchema,
  chatTransportRequestInputSchema,
} from "@notra/ai/schemas/chat";
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
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { Loader2Icon } from "lucide-react";
import { motion } from "motion/react";
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
} from "react";
import { ChatToolBlock } from "@/components/ai/chat-tool-block";
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
import { localStorageKeys } from "@/constants/storage";
import { authClient } from "@/lib/auth/client";
import { getMcpFaviconFromToolMetadata } from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import { isImageMimeType } from "@/lib/upload/mime";
import { cn } from "@/lib/utils";
import {
  CHAT_PREFERENCES_STORAGE_KEY,
  DEFAULT_CHAT_PREFERENCES,
  parseStoredChatModel,
  parseStoredThinkingLevel,
  readStoredChatPreferences,
  writeStoredChatPreferences,
} from "@/utils/chat-preferences";
import { formatLongDate, getGreeting } from "@/utils/dashboard-greeting";
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
  const [isOpen, setIsOpen] = useState(isStreaming);
  const [statusLabel, setStatusLabel] = useState(
    isStreaming ? THINKING_LABEL : formatReasoningDurationLabel(null)
  );
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming) {
      startTimeRef.current = Date.now();
      setDurationSeconds(null);
      setStatusLabel(THINKING_LABEL);
      setIsOpen(true);

      return;
    }

    const startedAt = startTimeRef.current;
    const nextDurationSeconds = startedAt
      ? Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))
      : null;

    setDurationSeconds(nextDurationSeconds);
    setStatusLabel(formatReasoningDurationLabel(nextDurationSeconds));

    const closeTimer = window.setTimeout(() => {
      setIsOpen(false);
    }, REASONING_AUTO_CLOSE_DELAY_MS);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming || durationSeconds !== null) {
      return;
    }

    setStatusLabel(formatReasoningDurationLabel(null));
  }, [durationSeconds, isStreaming]);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
        {isStreaming ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <HugeiconsIcon className="size-4" icon={AiBrain01Icon} />
        )}
        <span>{statusLabel}</span>
        <HugeiconsIcon
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
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

interface PageClientProps {
  organizationSlug: string;
  chatId?: string;
}

const CREATE_TOOL_TYPES = {
  "tool-createBlogPost": "blog_post",
  "tool-createChangelog": "changelog",
  "tool-createInvestorUpdate": "investor_update",
  "tool-createLinkedInPost": "linkedin_post",
  "tool-createTwitterPost": "twitter_post",
} satisfies Record<string, ContentType>;

function isCreateTool(type: string): boolean {
  return type in CREATE_TOOL_TYPES;
}

function getCreateToolContentType(
  type: keyof typeof CREATE_TOOL_TYPES
): ContentType {
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
}: PageClientProps) {
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
  const [isHydrated, setIsHydrated] = useState(false);

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
  contextRef.current = context;
  hasCustomizedContextRef.current = hasCustomizedContext;
  selectedModelRef.current = selectedModel;
  thinkingLevelRef.current = thinkingLevel;
  organizationIdRef.current = organizationId;

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

  const handleChatError = useCallback((err: Error) => {
    const errorMessage = err.message || String(err);

    try {
      const parsed = chatErrorPayloadSchema.safeParse(JSON.parse(errorMessage));

      if (parsed.success && parsed.data.error) {
        setChatError(parsed.data.error);
      }

      if (parsed.success && parsed.data.code === "USAGE_LIMIT_REACHED") {
        setChatError(
          "You've used all your chat messages this month. Upgrade for more."
        );
        return;
      }
    } catch {
      // Ignore non-JSON error payloads.
    }

    if (
      errorMessage.includes("USAGE_LIMIT_REACHED") ||
      errorMessage.includes("Usage limit reached")
    ) {
      setChatError(
        "You've used all your chat messages this month. Upgrade for more."
      );
      return;
    }
    console.error("Standalone chat error:", err);
    setPendingMessageId(null);
  }, []);

  const [wasStoppedByUser, setWasStoppedByUser] = useState(false);
  const wasStoppedByUserRef = useRef(wasStoppedByUser);
  wasStoppedByUserRef.current = wasStoppedByUser;

  const drainQueueRef = useRef<() => void>(() => {
    // Populated after dispatchMessage is defined below.
  });

  const handleFinish = useCallback(() => {
    setPendingMessageId(null);
    queryClient.invalidateQueries({ queryKey: ["autumn", "customer"] });
    queryClient.invalidateQueries({
      queryKey: ["chat-sessions", organizationId],
    });
    isDrainingRef.current = false;
    drainQueueRef.current();
  }, [organizationId, queryClient]);

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
    onError: handleChatError,
  });

  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const idle =
      typeof window !== "undefined" &&
      "requestIdleCallback" in window &&
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 1);
    const handle = idle(() => {
      import("@/components/ai/blog-changelog-preview");
      import("@/components/ai/twitter-preview");
      import("@/components/ai/linkedin-preview");
    });
    return () => {
      if (
        typeof window !== "undefined" &&
        "cancelIdleCallback" in window &&
        typeof window.cancelIdleCallback === "function" &&
        typeof handle === "number"
      ) {
        window.cancelIdleCallback(handle);
      } else if (typeof handle === "number") {
        window.clearTimeout(handle);
      }
    };
  }, []);

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
    } finally {
      stop();
    }
  }, [organizationId, stableChatId, stop]);

  const handleStop = useCallback(async () => {
    setIsStopping(true);
    setWasStoppedByUser(true);
    await stopActiveResponse();
  }, [stopActiveResponse]);

  const chatHistoryQuery = useQuery<{
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

  const hasMcpToolCalls = useMemo(
    () =>
      messages.some((message) =>
        message.parts?.some((part) => part.type === "dynamic-tool")
      ),
    [messages]
  );

  const mcpServersQuery = useQuery(
    dashboardOrpc.integrations.mcp.list.queryOptions({
      input: { organizationId },
      enabled: Boolean(organizationId) && hasMcpToolCalls,
    })
  );
  const mcpServers = mcpServersQuery.data?.servers;

  useLayoutEffect(() => {
    if (!chatHistoryQuery.data) {
      return;
    }
    const historyMessages = chatHistoryQuery.data.messages;
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
          const modelToRestore = metadata.requestedModel ?? metadata.model;
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
    setWasStoppedByUser(Boolean(chatHistoryQuery.data.lastResponseStopped));
    if (chatHistoryQuery.data.activeStreamId) {
      setPendingMessageId(chatHistoryQuery.data.activeStreamId);
    } else {
      setPendingMessageId(null);
    }
  }, [chatHistoryQuery.data, setMessages]);

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
    setWasStoppedByUser(false);
    setMessages([]);
    setContext([]);
    setHasCustomizedContext(false);
    setGeneratedChatId(crypto.randomUUID());
  }, [initialChatId, setMessages]);

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

  const pendingHistoryMessages = chatHistoryQuery.data?.messages?.length ?? 0;
  const isLoadingHistory =
    Boolean(initialChatId) &&
    messages.length === 0 &&
    (chatHistoryQuery.isLoading ||
      chatHistoryQuery.isPending ||
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
    if (!isLoading) {
      setIsStopping(false);
    }
  }, [isLoading]);

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
  messagesRef.current = messages;

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
      setWasStoppedByUser(false);
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
      setWasStoppedByUser(false);
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
      setWasStoppedByUser(false);
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
  queuedMessagesRef.current = queuedMessages;

  const isDrainingRef = useRef(false);
  const seenToolOutputsRef = useRef<Set<string>>(new Set());
  const prevIsLoadingRef = useRef(false);

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

  const messageCount = messages.length;
  const lastPartCount = messages.at(-1)?.parts?.length ?? 0;
  const hasScrolledRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages and new parts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (hasScrolledRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      hasScrolledRef.current = true;
      container.scrollTop = container.scrollHeight;
    }
  }, [messageCount, lastPartCount]);

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

  function renderPart(
    part: { type: string; [key: string]: unknown },
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

    if (part.type === "dynamic-tool") {
      const toolPart = part as {
        type: string;
        toolName: string;
        state: string;
        toolCallId: string;
        input?: unknown;
        output?: unknown;
        errorText?: string;
        toolMetadata?: unknown;
      };

      if (
        toolPart.state === "input-streaming" ||
        toolPart.state === "input-available" ||
        toolPart.state === "output-available" ||
        toolPart.state === "output-error"
      ) {
        return (
          <ChatToolBlock
            input={toolPart.input}
            isMcp={toolPart.toolName.startsWith("mcp_")}
            key={toolPart.toolCallId}
            mcpIconUrl={getMcpFaviconFromToolMetadata(
              toolPart.toolMetadata,
              mcpServers
            )}
            output={
              toolPart.state === "output-error"
                ? { error: toolPart.errorText }
                : toolPart.output
            }
            state={toolPart.state}
            toolMetadata={toolPart.toolMetadata}
            toolName={toolPart.toolName}
          />
        );
      }

      return null;
    }

    if (part.type.startsWith("tool-")) {
      const toolPart = part as {
        type: string;
        state: string;
        toolCallId: string;
        input?: { title?: string; markdown?: string };
        output?: { postId?: string; status?: string };
        approval?: { id: string; approved?: boolean; reason?: string };
        toolMetadata?: unknown;
      };
      const toolName = toolPart.type.replace("tool-", "");

      if (isCreateTool(toolPart.type)) {
        const contentType = getCreateToolContentType(
          toolPart.type as keyof typeof CREATE_TOOL_TYPES
        );
        const title = toolPart.input?.title ?? "Untitled";
        const markdown = toolPart.input?.markdown ?? "";

        if (
          toolPart.state === "input-streaming" ||
          toolPart.state === "input-available"
        ) {
          return (
            <div
              className="flex items-center gap-2 text-muted-foreground text-xs"
              key={toolPart.toolCallId}
            >
              <div className="flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                <span className="animate-pulse text-muted-foreground text-sm">
                  Thinking
                </span>
              </div>
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
        toolPart.state === "output-available"
      ) {
        return (
          <ChatToolBlock
            input={toolPart.input}
            key={toolPart.toolCallId}
            output={toolPart.output}
            state={toolPart.state}
            toolMetadata={toolPart.toolMetadata}
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="relative flex min-h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
  const showThinkingIndicator =
    isLoading &&
    lastMessage != null &&
    (lastMessage.role === "user" ||
      (lastMessage.role === "assistant" &&
        !lastMessage.parts.some(
          (p) =>
            (p.type === "text" && p.text.trim()) ||
            p.type === "reasoning" ||
            p.type.startsWith("tool-")
        )));
  const thinkingIndicatorLabel =
    lastMessage?.role === "user" ? "Getting Started" : "Thinking";
  const visibleMessages =
    showThinkingIndicator && lastMessage?.role === "assistant"
      ? messages.slice(0, -1)
      : messages;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          ref={scrollContainerRef}
        >
          <div className="relative flex min-h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pt-6 pb-28">
              <div
                className={cn(
                  "mx-auto flex w-full max-w-2xl flex-col gap-4",
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
                    const isEditing = isUser && editingMessageId === message.id;
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
                      <Message
                        className={cn(
                          isDownstreamOfBranchSwitch && "chat-branch-fade-in"
                        )}
                        from={message.role}
                        key={branchFadeKey}
                      >
                        {isUser ? (
                          <motion.div
                            className={cn(
                              "ml-auto overflow-hidden",
                              isEditing ? "w-full" : "flex w-fit max-w-full"
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
                          </motion.div>
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
                            onEdit={() => handleStartEditMessage(message.id)}
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
                          <AssistantMetadataHover metadata={message.metadata} />
                        )}
                      </Message>
                    );
                  });
                })()}
                {wasStoppedByUser && !isLoading && (
                  <div className="flex w-fit items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
                    <HugeiconsIcon className="size-3.5" icon={X} />
                    <span>Response stopped by user</span>
                  </div>
                )}
                {showThinkingIndicator && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2">
                        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                        <span className="animate-pulse text-muted-foreground text-sm">
                          {isStopping ? "Stopping" : thinkingIndicatorLabel}
                        </span>
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </div>
            </div>
            <div
              className={cn(
                "sticky bottom-0 z-10 bg-background px-4 pb-4",
                isFirstMessageTransition && "chat-input-slide-down"
              )}
            >
              <div className="-inset-x-4 pointer-events-none absolute bottom-full h-12 bg-linear-to-t from-background to-transparent" />
              <div className="mx-auto w-full max-w-2xl">
                <ChatQueue
                  messages={queuedMessages}
                  onEdit={handleEditQueued}
                  onRemove={handleRemoveQueued}
                />
                <ChatInputAdvanced
                  connectedTop={queuedMessages.length > 0}
                  context={context}
                  error={chatError}
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
        </div>
      </div>
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

export default function PageClient(props: PageClientProps) {
  return (
    <StandaloneChatPageClient
      chatId={props.chatId}
      key={props.chatId ?? "__new"}
      organizationSlug={props.organizationSlug}
    />
  );
}
