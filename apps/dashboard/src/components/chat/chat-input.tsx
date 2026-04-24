"use client";

import {
  AiBrain01Icon,
  ArrowRight01Icon,
  AtIcon,
  Attachment01Icon,
  Cancel01Icon,
  File02Icon,
  StopIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@notra/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Notra } from "@notra/ui/components/ui/svgs/notra";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { OpenaiDark } from "@notra/ui/components/ui/svgs/openaiDark";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { FEATURES } from "@/constants/features";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_FILE_SIZE,
  MIME_DISPLAY_LABELS,
  PASTE_TO_ATTACHMENT_THRESHOLD,
} from "@/constants/upload";
import { INPUT_SOURCES } from "@/lib/integrations/catalog";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  dragEventHasFiles,
  getUnsupportedAttachmentMessage,
} from "@/lib/upload/chat";
import {
  deleteChatUpload as deleteChatUploadFile,
  uploadFile,
} from "@/lib/upload/client";
import {
  getAllowedChatMimeTypes,
  isAllowedChatMimeType,
  isImageMimeType,
} from "@/lib/upload/mime";
import type {
  ChatAttachment,
  ChatInputHandle,
  ContextItem,
} from "@/types/chat";
import type { GitHubRepository } from "@/types/integrations";
import { AttachmentPreviewDialog } from "./attachment-preview";
import type { QueuedMessage } from "./chat-queue";
import {
  buildIntegrationReferenceElement,
  INTEGRATION_REFERENCE_SELECTOR,
  isIntegrationReferenceElement,
  parseIntegrationReferenceElement,
  parseReferenceValue,
  serializeEditorWithReferences,
  serializeFragmentWithReferences,
} from "./integration-reference";

export const AVAILABLE_MODELS = [
  {
    id: "auto",
    label: "Auto",
    description: "Picks the best model for your message",
    pricing: "Varies by selected model",
    provider: "auto",
  },
  {
    id: "anthropic/claude-opus-4.7",
    label: "Opus 4.7",
    description: "Deepest reasoning",
    pricing: "$5 input / $25 output per 1M",
    provider: "anthropic",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Sonnet 4.6",
    description: "Best everyday default",
    pricing: "$3 input / $15 output per 1M",
    provider: "anthropic",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Haiku 4.5",
    description: "Fastest responses",
    pricing: "$1 input / $5 output per 1M",
    provider: "anthropic",
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    description: "Best for creative writing",
    pricing: "$2.50 input / $15 output per 1M",
    provider: "openai",
  },
] as const;

type ModelProvider = (typeof AVAILABLE_MODELS)[number]["provider"];

export function ModelIcon({
  provider,
  className,
}: {
  provider: ModelProvider;
  className?: string;
}) {
  if (provider === "openai") {
    return (
      <>
        <Openai className={`${className ?? ""} block dark:hidden`} />
        <OpenaiDark className={`${className ?? ""} hidden dark:block`} />
      </>
    );
  }
  if (provider === "auto") {
    return <Notra className={className} />;
  }
  return <ClaudeAiIcon className={className} />;
}

const THINKING_LEVELS = ["off", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

function SubmitButtonContent({
  isEmpty,
  isLoading,
  isQueued,
  isStopping,
  canQueue,
}: {
  isEmpty: boolean;
  isLoading: boolean;
  isQueued: boolean;
  isStopping: boolean;
  canQueue: boolean;
}) {
  if (isLoading && isStopping) {
    return <Loader2Icon className="size-4 animate-spin" />;
  }
  if (isQueued) {
    return (
      <>
        <Loader2Icon className="size-3.5 animate-spin" />
        <div className="px-0.5 text-sm leading-0">Sending…</div>
      </>
    );
  }
  if (isLoading && isEmpty) {
    return (
      <>
        <HugeiconsIcon className="size-3.5" icon={StopIcon} />
        <div className="px-0.5 text-sm leading-0">Stop</div>
      </>
    );
  }
  if (canQueue) {
    return (
      <>
        <div className="px-0.5 text-sm leading-0">Queue</div>
        <div className="hidden h-4 items-center rounded border border-border bg-background px-1 text-[10px] text-muted-foreground shadow-xs sm:inline-flex">
          ↵
        </div>
      </>
    );
  }
  return (
    <>
      <div className="px-0.5 text-sm leading-0">Send</div>
      <div className="hidden h-4 items-center rounded border border-border bg-background px-1 text-[10px] text-muted-foreground shadow-xs sm:inline-flex">
        ↵
      </div>
    </>
  );
}

function getSubmitTooltipText({
  canQueue,
  isEmpty,
  isLoading,
  isQueued,
  isStopping,
}: {
  canQueue: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  isQueued: boolean;
  isStopping: boolean;
}): string {
  if (isLoading && isStopping) {
    return "Stopping...";
  }
  if (isQueued) {
    return "Will send once uploads finish. Click to cancel.";
  }
  if (isLoading && isEmpty) {
    return "Stop generating";
  }
  if (canQueue) {
    return "Enter to queue this message. It will send once the AI finishes.";
  }
  return "Enter to send. Shift+Enter for a new line.";
}

function contextItemsEqual(a: ContextItem, b: ContextItem): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === "github-repo" && b.type === "github-repo") {
    return a.owner === b.owner && a.repo === b.repo;
  }
  if (a.type === "linear-team" && b.type === "linear-team") {
    return a.integrationId === b.integrationId;
  }
  return false;
}

interface ChatInputAdvancedProps {
  onSend?: (value: string, attachments: ChatAttachment[]) => void;
  onStop?: () => void;
  initialValue?: string;
  isLoading?: boolean;
  isStopping?: boolean;
  organizationSlug?: string;
  organizationId?: string;
  context?: ContextItem[];
  onAddContext?: (item: ContextItem) => void;
  onRemoveContext?: (item: ContextItem) => void;
  error?: string | null;
  onClearError?: () => void;
  model?: string;
  onModelChange?: (model: string) => void;
  thinkingLevel?: ThinkingLevel;
  onThinkingLevelChange?: (level: ThinkingLevel) => void;
  connectedTop?: boolean;
  queuedMessages?: QueuedMessage[];
  onUpdateQueued?: (id: string, text: string) => void;
  ref?: Ref<ChatInputHandle>;
}

const THINKING_LABELS: Record<ThinkingLevel, string> = {
  off: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface PendingUploadItem {
  id: string;
  filename: string;
}

interface QueuedSendSnapshot {
  value: string;
  attachments: ChatAttachment[];
  pendingUploadIds: string[];
}

export function ChatInputAdvanced({
  onSend,
  onStop,
  initialValue,
  isLoading = false,
  isStopping = false,
  organizationSlug,
  organizationId,
  context = [],
  onAddContext,
  onRemoveContext,
  error: externalError,
  onClearError,
  model = "auto",
  onModelChange,
  thinkingLevel = "medium",
  onThinkingLevelChange,
  connectedTop = false,
  ref,
}: ChatInputAdvancedProps) {
  const currentModel =
    AVAILABLE_MODELS.find((availableModel) => availableModel.id === model) ??
    AVAILABLE_MODELS[0];
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionAnchorRef = useRef<{ node: Node; offset: number } | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const mentionListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastInitialValueRef = useRef<string | undefined>(undefined);
  const contextRef = useRef(context);
  contextRef.current = context;

  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [pendingSend, setPendingSend] = useState<QueuedSendSnapshot | null>(
    null
  );
  const [previewAttachment, setPreviewAttachment] =
    useState<ChatAttachment | null>(null);
  const isUploading = pendingUploads.length > 0;
  const isQueued = pendingSend !== null;
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const pendingUploadsRef = useRef(pendingUploads);
  pendingUploadsRef.current = pendingUploads;
  const completedUploadsRef = useRef(new Map<string, ChatAttachment>());
  const isMountedRef = useRef(true);
  const submittedKeysRef = useRef<Set<string>>(new Set());

  const allowedChatMimeTypes = useMemo(
    () => getAllowedChatMimeTypes(model),
    [model]
  );
  const acceptedFileTypesLabel = useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const mime of allowedChatMimeTypes) {
      const label = MIME_DISPLAY_LABELS[mime];
      if (label && !seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
    return labels.join(", ");
  }, [allowedChatMimeTypes]);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const hasUnsupportedAttachmentsForModel = attachments.some(
    (attachment) => !isAllowedChatMimeType(attachment.mediaType, model)
  );
  const attachmentTooltipText =
    model === "openai/gpt-5.4"
      ? "Attach images or PDFs"
      : "Attach images, PDFs, or text";

  const cleanupChatUpload = useCallback(async (key: string) => {
    try {
      await deleteChatUploadFile({ key });
    } catch {
      // Best-effort cleanup for abandoned uploads.
    }
  }, []);

  const removeAttachment = useCallback(
    (key: string) => {
      const attachmentToRemove = attachmentsRef.current.find(
        (attachment) => attachment.key === key
      );
      if (!attachmentToRemove) {
        return;
      }
      setAttachments((prev) => {
        const next = prev.filter((attachment) => attachment.key !== key);
        attachmentsRef.current = next;
        return next;
      });
      cleanupChatUpload(attachmentToRemove.key).catch(() => undefined);
    },
    [cleanupChatUpload]
  );

  const updatePendingUploads = useCallback((next: PendingUploadItem[]) => {
    pendingUploadsRef.current = next;
    if (isMountedRef.current) {
      setPendingUploads(next);
    }
  }, []);

  const handleFilesSelected = useCallback(
    async (selected: FileList | File[]) => {
      const files = Array.from(selected);
      if (files.length === 0) {
        return false;
      }

      const remainingSlots =
        MAX_CHAT_ATTACHMENTS -
        attachmentsRef.current.length -
        pendingUploadsRef.current.length;
      if (remainingSlots <= 0) {
        toast.error(
          `You can attach at most ${MAX_CHAT_ATTACHMENTS} files per message.`
        );
        return false;
      }

      const accepted: File[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        if (!isAllowedChatMimeType(file.type, model)) {
          toast.error(
            file.type === "text/plain" || file.type === "text/markdown"
              ? getUnsupportedAttachmentMessage(currentModel.label)
              : `Unsupported file type: ${file.name}`
          );
          continue;
        }
        if (file.size > MAX_CHAT_FILE_SIZE) {
          toast.error(
            `${file.name} exceeds the ${MAX_CHAT_FILE_SIZE / 1024 / 1024}MB limit.`
          );
          continue;
        }
        accepted.push(file);
      }

      if (accepted.length === 0) {
        return false;
      }

      const placeholders = accepted.map((file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
      }));
      updatePendingUploads([...pendingUploadsRef.current, ...placeholders]);

      const results = await Promise.all(
        accepted.map(async (file, index) => {
          const placeholder = placeholders[index];
          if (!placeholder) {
            return false;
          }
          try {
            const result = await uploadFile({ file, type: "chat" });
            const uploadedAttachment = {
              url: result.url,
              key: result.key,
              filename: file.name,
              mediaType: file.type,
              size: file.size,
            };
            completedUploadsRef.current.set(placeholder.id, uploadedAttachment);

            if (!isMountedRef.current) {
              await cleanupChatUpload(result.key);
              return false;
            }

            setAttachments((prev) => {
              const next = [...prev, uploadedAttachment];
              attachmentsRef.current = next;
              return next;
            });
            return true;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Upload failed";
            toast.error(`Failed to upload ${file.name}: ${message}`);
            // Do NOT null pendingSend here. The drain effect (keyed on
            // isUploading reaching 0) surfaces a user-facing "Some attachments
            // failed to upload" error when it detects missing completions.
            // Nulling here would silently drop the queued message.
            return false;
          } finally {
            updatePendingUploads(
              pendingUploadsRef.current.filter(
                (pending) => pending.id !== placeholder.id
              )
            );
          }
        })
      );
      return results.every(Boolean);
    },
    [cleanupChatUpload, currentModel.label, model, updatePendingUploads]
  );

  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFilesSelected(files).catch(() => undefined);
      }
      event.target.value = "";
    },
    [handleFilesSelected]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      // Never GC attachments that were already submitted — the chat history
      // references those URLs and needs them to persist server-side.
      for (const attachment of attachmentsRef.current) {
        if (submittedKeysRef.current.has(attachment.key)) {
          continue;
        }
        cleanupChatUpload(attachment.key).catch(() => undefined);
      }
    };
  }, [cleanupChatUpload]);

  useEffect(() => {
    function onDragEnter(event: DragEvent) {
      if (!dragEventHasFiles(event)) {
        return;
      }
      dragCounterRef.current += 1;
      setIsDraggingFile(true);
    }
    function onDragLeave(event: DragEvent) {
      if (!dragEventHasFiles(event)) {
        return;
      }
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDraggingFile(false);
      }
    }
    function onDragOver(event: DragEvent) {
      if (!dragEventHasFiles(event)) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }
    function onDrop(event: DragEvent) {
      const files = event.dataTransfer?.files;
      const hasFiles = (files && files.length > 0) || dragEventHasFiles(event);
      if (!hasFiles) {
        return;
      }
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
      if (files && files.length > 0) {
        handleFilesSelected(files).catch(() => undefined);
      }
    }

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [handleFilesSelected]);
  const { check, data: customer } = useCustomer();

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
  const isUsageBlocked = checkResult ? checkResult.allowed === false : false;
  const limitMessage = "No chat credits left.";
  const usageLimitError =
    externalError ?? internalError ?? (isUsageBlocked ? limitMessage : null);

  const clearError = useCallback(() => {
    setInternalError(null);
    onClearError?.();
  }, [onClearError]);

  const { data: integrationsData } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const enabledRepos = useMemo(() => {
    const result: Array<GitHubRepository & { integrationId: string }> = [];
    for (const integration of integrationsData?.integrations ?? []) {
      for (const repo of integration.repositories) {
        if (repo.enabled) {
          result.push({ ...repo, integrationId: integration.id });
        }
      }
    }
    return result;
  }, [integrationsData?.integrations]);

  const enabledLinearIntegrations = useMemo(() => {
    const result: Array<{
      id: string;
      displayName: string;
      integrationId: string;
      teamName?: string | null;
    }> = [];
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

  type MentionItem =
    | { kind: "github"; data: GitHubRepository & { integrationId: string } }
    | {
        kind: "linear";
        data: {
          id: string;
          displayName: string;
          integrationId: string;
          teamName?: string | null;
        };
      };

  const isRepoInContext = useCallback(
    (repo: GitHubRepository & { integrationId: string }) =>
      context.some(
        (c) =>
          c.type === "github-repo" &&
          c.owner === repo.owner &&
          c.repo === repo.repo
      ),
    [context]
  );

  const isLinearInContext = useCallback(
    (integration: { integrationId: string }) =>
      context.some(
        (c) =>
          c.type === "linear-team" &&
          c.integrationId === integration.integrationId
      ),
    [context]
  );

  const filteredMentionItems = useMemo(() => {
    if (mentionQuery === null) {
      return [];
    }
    const q = mentionQuery.toLowerCase();
    const items: MentionItem[] = [];
    for (const repo of enabledRepos) {
      if (`${repo.owner}/${repo.repo}`.toLowerCase().includes(q)) {
        items.push({ kind: "github", data: repo });
      }
    }
    for (const integration of enabledLinearIntegrations) {
      if (integration.displayName.toLowerCase().includes(q)) {
        items.push({ kind: "linear", data: integration });
      }
    }
    return items;
  }, [mentionQuery, enabledRepos, enabledLinearIntegrations]);

  const readEditorText = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return "";
    }
    return (editor.innerText ?? "").replace(/\u00A0/g, " ");
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setText: (text: string) => {
        const editor = editorRef.current;
        if (!editor) {
          return;
        }
        editor.textContent = text;
        setIsEmpty(text.trim().length === 0);
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }),
    []
  );

  const syncContextFromDOM = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const chips = Array.from(
      editor.querySelectorAll<HTMLElement>(INTEGRATION_REFERENCE_SELECTOR)
    );
    const editorItems = chips
      .map(parseIntegrationReferenceElement)
      .filter((x): x is ContextItem => x !== null);

    const current = contextRef.current;
    for (const existing of current) {
      if (!editorItems.some((e) => contextItemsEqual(e, existing))) {
        onRemoveContext?.(existing);
      }
    }
    for (const next of editorItems) {
      if (!current.some((c) => contextItemsEqual(c, next))) {
        onAddContext?.(next);
      }
    }
  }, [onAddContext, onRemoveContext]);

  const insertChipAndSpace = useCallback(
    (chip: HTMLSpanElement, replaceRange: Range) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      replaceRange.deleteContents();
      replaceRange.insertNode(chip);
      const space = document.createTextNode("\u00A0");
      const afterChip = document.createRange();
      afterChip.setStartAfter(chip);
      afterChip.collapse(true);
      afterChip.insertNode(space);

      const cursor = document.createRange();
      cursor.setStartAfter(space);
      cursor.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(cursor);

      setIsEmpty(readEditorText().trim().length === 0);
      syncContextFromDOM();
    },
    [readEditorText, syncContextFromDOM]
  );

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    setIsEmpty(readEditorText().trim().length === 0);

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setMentionQuery(null);
      mentionAnchorRef.current = null;
      syncContextFromDOM();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer)) {
      setMentionQuery(null);
      mentionAnchorRef.current = null;
      syncContextFromDOM();
      return;
    }

    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const nodeText = range.startContainer.textContent ?? "";
      const textBefore = nodeText.slice(0, range.startOffset);

      const atIndex = textBefore.lastIndexOf("@");
      if (atIndex !== -1) {
        const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : " ";
        const isBoundary =
          atIndex === 0 ||
          charBefore === " " ||
          charBefore === "\n" ||
          charBefore === "\u00A0";
        if (isBoundary) {
          const query = textBefore.slice(atIndex + 1);
          if (
            !(
              query.includes(" ") ||
              query.includes("\n") ||
              query.includes("\u00A0")
            )
          ) {
            mentionAnchorRef.current = {
              node: range.startContainer,
              offset: atIndex,
            };
            setMentionQuery(query);
            setMentionIndex(0);
            syncContextFromDOM();
            return;
          }
        }
      }
    }

    mentionAnchorRef.current = null;
    setMentionQuery(null);
    syncContextFromDOM();
  }, [readEditorText, syncContextFromDOM]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || initialValue === lastInitialValueRef.current) {
      return;
    }

    lastInitialValueRef.current = initialValue;
    editor.replaceChildren();

    if (initialValue) {
      editor.append(document.createTextNode(initialValue));
    }

    setIsEmpty(!(initialValue?.trim().length ?? 0));
    setMentionQuery(null);
    mentionAnchorRef.current = null;

    if (!initialValue) {
      return;
    }

    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [initialValue]);

  const insertMention = useCallback(
    (item: MentionItem) => {
      const editor = editorRef.current;
      const anchor = mentionAnchorRef.current;
      if (!editor || !anchor) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return;
      }
      const cursor = sel.getRangeAt(0);
      if (!editor.contains(cursor.startContainer)) {
        return;
      }

      const contextItem: ContextItem =
        item.kind === "github"
          ? {
              type: "github-repo",
              owner: item.data.owner,
              repo: item.data.repo,
              integrationId: item.data.integrationId,
            }
          : {
              type: "linear-team",
              integrationId: item.data.integrationId,
              teamName: item.data.teamName ?? undefined,
            };

      const replaceRange = document.createRange();
      replaceRange.setStart(anchor.node, anchor.offset);
      replaceRange.setEnd(cursor.startContainer, cursor.startOffset);

      const chip = buildIntegrationReferenceElement(contextItem);
      insertChipAndSpace(chip, replaceRange);

      mentionAnchorRef.current = null;
      setMentionQuery(null);
      editor.focus();
    },
    [insertChipAndSpace]
  );

  const insertChipAtCursor = useCallback(
    (item: ContextItem) => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      if (contextRef.current.some((c) => contextItemsEqual(c, item))) {
        return;
      }
      editor.focus();
      const sel = window.getSelection();
      let range: Range;
      if (
        sel &&
        sel.rangeCount > 0 &&
        editor.contains(sel.getRangeAt(0).startContainer)
      ) {
        range = sel.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      const chip = buildIntegrationReferenceElement(item);
      insertChipAndSpace(chip, range);
    },
    [insertChipAndSpace]
  );

  const removeChipForItem = useCallback(
    (item: ContextItem) => {
      const editor = editorRef.current;
      if (editor) {
        const chips = Array.from(
          editor.querySelectorAll<HTMLElement>(INTEGRATION_REFERENCE_SELECTOR)
        );
        for (const chip of chips) {
          const parsed = parseIntegrationReferenceElement(chip);
          if (parsed && contextItemsEqual(parsed, item)) {
            const next = chip.nextSibling;
            chip.remove();
            if (
              next &&
              next.nodeType === Node.TEXT_NODE &&
              next.textContent === "\u00A0"
            ) {
              next.parentNode?.removeChild(next);
            }
            break;
          }
        }
        setIsEmpty(readEditorText().trim().length === 0);
      }
      onRemoveContext?.(item);
    },
    [onRemoveContext, readEditorText]
  );

  const insertTextAtRange = useCallback((text: string, targetRange?: Range) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = window.getSelection();
    let range: Range | null = null;

    if (
      targetRange?.startContainer.isConnected &&
      editor.contains(targetRange.startContainer)
    ) {
      range = targetRange;
    } else if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    if (!range) {
      return;
    }

    range.deleteContents();

    const fragment = document.createDocumentFragment();
    const segments = text.split(
      /(@?integration\/(?:github\/[^/\s]+\/[^/\s]+\/[^/\s]+|linear\/[^/\s]+))/g
    );

    for (const segment of segments) {
      if (!segment) {
        continue;
      }

      const referenceItem = parseReferenceValue(segment);
      if (referenceItem) {
        fragment.append(buildIntegrationReferenceElement(referenceItem));
        continue;
      }

      const lines = segment.split("\n");
      lines.forEach((line, index) => {
        if (line) {
          fragment.append(document.createTextNode(line));
        }
        if (index < lines.length - 1) {
          fragment.append(document.createElement("br"));
        }
      });
    }

    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    const after = document.createRange();
    if (lastNode) {
      after.setStartAfter(lastNode);
    } else {
      after.setStart(range.endContainer, range.endOffset);
    }
    after.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(after);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  const clearComposer = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.innerHTML = "";
    }
    setIsEmpty(true);
    setAttachments([]);
    attachmentsRef.current = [];
    setPendingSend(null);
    completedUploadsRef.current.clear();
    for (const item of contextRef.current) {
      onRemoveContext?.(item);
    }
  }, [onRemoveContext]);

  const sendSnapshot = useCallback(
    (value: string, snapshotAttachments: ChatAttachment[]) => {
      if (isLoading) {
        return false;
      }
      if (!(value || snapshotAttachments.length > 0)) {
        return false;
      }
      clearError();
      if (
        snapshotAttachments.some(
          (attachment) => !isAllowedChatMimeType(attachment.mediaType, model)
        )
      ) {
        return false;
      }
      if (isUsageBlocked) {
        setInternalError(limitMessage);
        return false;
      }
      if (customer) {
        const result = check({
          featureId: FEATURES.AI_CREDITS,
          requiredBalance: 1,
        });
        if (result?.allowed === false) {
          setInternalError(limitMessage);
          return false;
        }
      }

      for (const attachment of snapshotAttachments) {
        submittedKeysRef.current.add(attachment.key);
      }
      onSend?.(value, snapshotAttachments);
      clearComposer();
      return true;
    },
    [
      check,
      clearComposer,
      clearError,
      customer,
      isLoading,
      isUsageBlocked,
      model,
      onSend,
    ]
  );

  const performSend = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || isLoading) {
      return false;
    }
    const hasText = readEditorText().trim().length > 0;
    const currentAttachments = attachmentsRef.current;
    if (!hasText && currentAttachments.length === 0) {
      return false;
    }
    const outbound = serializeEditorWithReferences(editor).trim();
    return sendSnapshot(outbound, currentAttachments);
  }, [isLoading, readEditorText, sendSnapshot]);

  const handleSend = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (isLoading) {
      const hasText = readEditorText().trim().length > 0;
      const hasAttachments =
        attachmentsRef.current.length > 0 ||
        pendingUploadsRef.current.length > 0;
      if (!hasText || hasAttachments) {
        return;
      }
      clearError();
      if (isUsageBlocked) {
        setInternalError(limitMessage);
        return;
      }
      if (customer) {
        const result = check({
          featureId: FEATURES.AI_CREDITS,
          requiredBalance: 1,
        });
        if (result?.allowed === false) {
          setInternalError(limitMessage);
          return;
        }
      }
      onSend?.(serializeEditorWithReferences(editor).trim(), []);
      clearComposer();
      return;
    }
    if (isUploading) {
      const hasText = readEditorText().trim().length > 0;
      const hasContent =
        hasText ||
        attachmentsRef.current.length > 0 ||
        pendingUploadsRef.current.length > 0;
      if (!hasContent) {
        return;
      }
      if (hasUnsupportedAttachmentsForModel) {
        return;
      }
      if (isUsageBlocked) {
        setInternalError(limitMessage);
        return;
      }
      clearError();
      setPendingSend({
        value: serializeEditorWithReferences(editor).trim(),
        attachments: [...attachmentsRef.current],
        pendingUploadIds: pendingUploadsRef.current.map(
          (pending) => pending.id
        ),
      });
      return;
    }
    performSend();
  }, [
    check,
    clearComposer,
    clearError,
    customer,
    isLoading,
    isUploading,
    readEditorText,
    hasUnsupportedAttachmentsForModel,
    isUsageBlocked,
    onSend,
    performSend,
  ]);

  useEffect(() => {
    if (!(pendingSend && !isUploading)) {
      return;
    }
    const resolvedAttachments = pendingSend.pendingUploadIds
      .map((pendingUploadId) =>
        completedUploadsRef.current.get(pendingUploadId)
      )
      .filter((attachment): attachment is ChatAttachment => attachment != null);

    if (resolvedAttachments.length !== pendingSend.pendingUploadIds.length) {
      setPendingSend(null);
      setInternalError(
        "Some attachments failed to upload. Please remove or retry them before sending."
      );
      return;
    }

    sendSnapshot(pendingSend.value, [
      ...pendingSend.attachments,
      ...resolvedAttachments,
    ]);
  }, [isUploading, pendingSend, sendSnapshot]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const pasteTimestamp = Date.now();
      const pastedFiles = Array.from(event.clipboardData.files).map(
        (file, index) => {
          const hasMeaningfulName =
            file.name && !/^image\.(jpe?g|png|gif|webp)$/i.test(file.name);
          if (hasMeaningfulName) {
            return file;
          }
          const extFromType = file.type.split("/")[1]?.split("+")[0];
          const extFromName = file.name?.includes(".")
            ? file.name.split(".").pop()
            : undefined;
          const ext = extFromName ?? extFromType ?? "png";
          const suffix = index === 0 ? "" : `-${index}`;
          return new File([file], `pasted-${pasteTimestamp}${suffix}.${ext}`, {
            type: file.type,
            lastModified: file.lastModified,
          });
        }
      );
      if (pastedFiles.length > 0) {
        event.preventDefault();
        handleFilesSelected(pastedFiles).catch(() => undefined);
        return;
      }

      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");

      if (
        text.length >= PASTE_TO_ATTACHMENT_THRESHOLD &&
        isAllowedChatMimeType("text/plain", model)
      ) {
        const selection = window.getSelection();
        const fallbackRange =
          selection && selection.rangeCount > 0
            ? selection.getRangeAt(0).cloneRange()
            : undefined;
        const file = new File([text], `pasted-${Date.now()}.txt`, {
          type: "text/plain",
        });
        handleFilesSelected([file])
          .then((uploaded) => {
            if (!uploaded) {
              insertTextAtRange(text, fallbackRange);
            }
          })
          .catch(() => {
            insertTextAtRange(text, fallbackRange);
          });
        return;
      }

      insertTextAtRange(text);
    },
    [handleFilesSelected, insertTextAtRange, model]
  );

  const handleCopy = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer) || range.collapsed) {
        return;
      }

      event.preventDefault();
      const fragment = range.cloneContents();
      const serialized = serializeFragmentWithReferences(fragment);
      event.clipboardData.setData("text/plain", serialized);
    },
    []
  );

  const handleCut = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer) || range.collapsed) {
        return;
      }

      event.preventDefault();
      const fragment = range.cloneContents();
      const serialized = serializeFragmentWithReferences(fragment);
      event.clipboardData.setData("text/plain", serialized);

      range.deleteContents();
      selection.removeAllRanges();
      selection.addRange(range);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (mentionQuery !== null && filteredMentionItems.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((prev) =>
            prev < filteredMentionItems.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredMentionItems.length - 1
          );
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const selected = filteredMentionItems[mentionIndex];
          if (selected) {
            insertMention(selected);
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMentionQuery(null);
          mentionAnchorRef.current = null;
          return;
        }
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
        return;
      }

      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return;
        }
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement("br");
        range.insertNode(br);
        const after = document.createRange();
        after.setStartAfter(br);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
        editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      if (event.key === "Backspace") {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !sel.getRangeAt(0).collapsed) {
          return;
        }
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        let prev: ChildNode | null = null;
        if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
          prev = node.previousSibling;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          prev = (node as Element).childNodes[range.startOffset - 1] ?? null;
        }
        if (
          prev &&
          prev.nodeType === Node.TEXT_NODE &&
          prev.textContent === "\u00A0"
        ) {
          prev = prev.previousSibling;
        }
        if (isIntegrationReferenceElement(prev)) {
          event.preventDefault();
          const nextOfChip = prev.nextSibling;
          prev.remove();
          if (
            nextOfChip &&
            nextOfChip.nodeType === Node.TEXT_NODE &&
            nextOfChip.textContent === "\u00A0"
          ) {
            nextOfChip.parentNode?.removeChild(nextOfChip);
          }
          editorRef.current?.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      }
    },
    [
      mentionQuery,
      filteredMentionItems,
      mentionIndex,
      insertMention,
      handleSend,
    ]
  );

  return (
    <>
      {isDraggingFile &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden="true"
            className="fade-in-0 pointer-events-none fixed inset-0 z-[100] flex animate-in items-center justify-center bg-background/75 backdrop-blur-sm duration-150"
          >
            <div className="flex flex-col items-center gap-5">
              <HugeiconsIcon
                className="size-14 text-foreground"
                icon={Upload04Icon}
                strokeWidth={1.5}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="font-semibold text-2xl text-foreground tracking-tight">
                  Add Attachment
                </p>
                <p className="text-muted-foreground text-sm">
                  Drop a file here to attach it to your message
                </p>
                {acceptedFileTypesLabel && (
                  <p className="text-muted-foreground/70 text-xs">
                    Accepted file types: {acceptedFileTypesLabel}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      <Card
        className={`w-full gap-0 overflow-visible rounded-[14px] border-0 bg-background py-0 shadow-none ring-0 transition-shadow duration-200 ease-out-expo ${connectedTop ? "rounded-t-none" : ""}`}
        data-focused={isFocused ? "true" : "false"}
      >
        <CardHeader className="sr-only">
          <span>Chat input</span>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className={`rounded-[14px] border border-border bg-background shadow-sm ${connectedTop ? "rounded-t-none border-t-0" : ""}`}
            tabIndex={-1}
          >
            <section
              aria-label="Chat input drop area"
              className={`p-0.5 ${connectedTop ? "rounded-b-[13px]" : "rounded-[13px]"}`}
            >
              <input
                accept={allowedChatMimeTypes.join(",")}
                className="hidden"
                multiple
                onChange={onFileInputChange}
                ref={fileInputRef}
                type="file"
              />
              {(attachments.length > 0 || pendingUploads.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 px-2 pt-2">
                  {attachments.map((attachment) => {
                    const isImage = isImageMimeType(attachment.mediaType);
                    const openAttachment = () => {
                      setPreviewAttachment(attachment);
                    };
                    return (
                      <div
                        className="group/attachment relative flex items-center gap-1 rounded-md border border-border bg-muted/40 py-1 pr-1 pl-1 text-xs"
                        key={attachment.key}
                      >
                        <button
                          aria-label={`Preview ${attachment.filename}`}
                          className="flex items-center gap-1.5 rounded px-0.5 transition-colors hover:bg-accent/50"
                          onClick={openAttachment}
                          type="button"
                        >
                          {isImage ? (
                            <Image
                              alt={attachment.filename}
                              className="size-5 rounded object-cover"
                              height={20}
                              src={attachment.url}
                              width={20}
                            />
                          ) : (
                            <HugeiconsIcon
                              className="size-3.5 text-muted-foreground"
                              icon={File02Icon}
                            />
                          )}
                          <span className="max-w-[10rem] truncate text-foreground">
                            {attachment.filename}
                          </span>
                        </button>
                        <button
                          aria-label={`Remove ${attachment.filename}`}
                          className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          disabled={isQueued}
                          onClick={() => removeAttachment(attachment.key)}
                          type="button"
                        >
                          <HugeiconsIcon
                            className="size-3"
                            icon={Cancel01Icon}
                          />
                        </button>
                      </div>
                    );
                  })}
                  {pendingUploads.map((pending) => (
                    <div
                      className="flex items-center gap-1.5 rounded-md border border-border border-dashed bg-muted/20 px-1.5 py-1 text-muted-foreground text-xs"
                      key={pending.id}
                    >
                      <Loader2Icon className="size-3 animate-spin" />
                      <span className="max-w-[10rem] truncate">
                        {pending.filename}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {usageLimitError && (
                <div className="mx-2 mt-2 mb-1 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
                  <span>{usageLimitError}</span>
                  {organizationSlug && (
                    <Link
                      className="font-medium underline underline-offset-2"
                      href={`/${organizationSlug}/settings/billing`}
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              )}
              <div className="relative flex flex-col rounded-t-[13px] bg-background">
                <div className="flex w-full items-center rounded-t-[12px]">
                  <div className="relative flex flex-1 cursor-text transition-colors [--lh:1lh]">
                    {/* biome-ignore lint/a11y/useSemanticElements: rich mention editor requires a contentEditable host instead of a native textarea. */}
                    <div
                      aria-disabled={isUsageBlocked || isQueued}
                      aria-label="Send a message"
                      aria-multiline="true"
                      className="wrap-break-word relative max-h-50 min-h-12 w-full overflow-y-auto whitespace-pre-wrap rounded-t-[12px] px-3 py-2 text-foreground text-sm leading-6 caret-foreground outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[empty=true]:before:pointer-events-none data-[empty=true]:before:absolute data-[empty=true]:before:top-2 data-[empty=true]:before:left-3 data-[empty=true]:before:text-muted-foreground data-[empty=true]:before:content-[attr(data-placeholder)]"
                      contentEditable={!(isUsageBlocked || isQueued)}
                      data-empty={isEmpty ? "true" : "false"}
                      data-placeholder={
                        isLoading
                          ? "Queue a message while AI is working..."
                          : "Send a message... (type @ to add context)"
                      }
                      onBlur={() => {
                        setIsFocused(false);
                        setTimeout(() => {
                          if (
                            !mentionListRef.current?.contains(
                              document.activeElement
                            )
                          ) {
                            setMentionQuery(null);
                            mentionAnchorRef.current = null;
                          }
                        }, 150);
                      }}
                      onCopy={handleCopy}
                      onCut={handleCut}
                      onFocus={() => setIsFocused(true)}
                      onInput={handleInput}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      ref={editorRef}
                      role="textbox"
                      suppressContentEditableWarning
                      tabIndex={
                        isLoading || isUsageBlocked || isQueued ? -1 : 0
                      }
                    />
                  </div>
                </div>
                {mentionQuery !== null && (
                  <div
                    className="absolute bottom-full left-1 z-50 mb-1 w-56"
                    ref={mentionListRef}
                  >
                    <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                      <div className="px-2 py-1.5 font-semibold text-xs">
                        Integrations
                      </div>
                      {filteredMentionItems.length > 0 ? (
                        <>
                          {filteredMentionItems.map((item, idx) => {
                            const key =
                              item.kind === "github"
                                ? item.data.id
                                : item.data.integrationId;
                            const inContext =
                              item.kind === "github"
                                ? isRepoInContext(item.data)
                                : isLinearInContext(item.data);
                            const label =
                              item.kind === "github"
                                ? `${item.data.owner}/${item.data.repo}`
                                : item.data.displayName;
                            return (
                              <button
                                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors ${
                                  idx === mentionIndex
                                    ? "bg-accent text-accent-foreground"
                                    : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                                key={key}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  insertMention(item);
                                }}
                                type="button"
                              >
                                {item.kind === "github" ? (
                                  <Github className="size-4" />
                                ) : (
                                  <Linear className="size-4" />
                                )}
                                <span className="truncate text-sm">
                                  {label}
                                </span>
                                {inContext && (
                                  <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                    Added
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {organizationSlug && (
                            <>
                              <div className="-mx-1 my-1 h-px bg-border" />
                              <Link
                                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                href={`/${organizationSlug}/integrations`}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Manage integrations
                              </Link>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                          <span className="text-muted-foreground text-xs">
                            {enabledRepos.length === 0 &&
                            enabledLinearIntegrations.length === 0
                              ? "No integrations connected"
                              : "No matches found"}
                          </span>
                          {enabledRepos.length === 0 &&
                            enabledLinearIntegrations.length === 0 &&
                            organizationSlug && (
                              <Link
                                className="text-primary text-xs hover:underline"
                                href={`/${organizationSlug}/integrations`}
                              >
                                Connect integrations
                              </Link>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {shouldShowLowCredits && (
                <div className="px-3 pb-1 text-muted-foreground text-xs">
                  {remainingChatCredits} chat messages left
                </div>
              )}
              <CardFooter className="flex items-center gap-1.5 overflow-hidden rounded-b-[12px] border-t-0 bg-transparent p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        className="bg-muted hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading || isQueued}
                        size="sm"
                        variant="outline"
                      />
                    }
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <HugeiconsIcon
                        className="size-3.5"
                        icon={AiBrain01Icon}
                      />
                      {THINKING_LABELS[thinkingLevel]}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Thinking effort</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    {THINKING_LEVELS.map((level) => (
                      <DropdownMenuItem
                        key={level}
                        onClick={() => onThinkingLevelChange?.(level)}
                      >
                        <span className="text-sm capitalize">
                          {level === "off" ? "Off" : THINKING_LABELS[level]}
                        </span>
                        {thinkingLevel === level && (
                          <span className="ml-auto text-primary text-xs">
                            ✓
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        className="bg-muted hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading || isQueued}
                        size="sm"
                        variant="outline"
                      />
                    }
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <ModelIcon
                        className="size-3.5"
                        provider={currentModel.provider}
                      />
                      {currentModel.label}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Model</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    {AVAILABLE_MODELS.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => {
                          if (
                            m.id === "openai/gpt-5.4" &&
                            attachmentsRef.current.some(
                              (attachment) =>
                                !isAllowedChatMimeType(
                                  attachment.mediaType,
                                  m.id
                                )
                            )
                          ) {
                            toast.error(
                              getUnsupportedAttachmentMessage(m.label)
                            );
                            return;
                          }
                          onModelChange?.(m.id);
                        }}
                      >
                        <ModelIcon
                          className="size-4 shrink-0"
                          provider={m.provider}
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm">{m.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {m.description}
                          </span>
                          <span className="text-[0.625rem] text-muted-foreground/70">
                            {m.pricing}
                          </span>
                        </div>
                        {model === m.id && (
                          <span className="ml-auto shrink-0 text-primary text-xs">
                            ✓
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="flex items-center gap-1.5 rounded-lg border border-border border-dashed px-2.5 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading || isQueued}
                        type="button"
                      />
                    }
                  >
                    <HugeiconsIcon className="size-3.5" icon={AtIcon} />
                    Context
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Integrations</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    {INPUT_SOURCES.map((integration) => {
                      const isGitHub = integration.id === "github";
                      const isLinear = integration.id === "linear";
                      const isAvailable = integration.available;

                      if (isGitHub && isAvailable && enabledRepos.length > 0) {
                        return (
                          <DropdownMenuSub key={integration.id}>
                            <DropdownMenuSubTrigger>
                              <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                                {integration.icon}
                              </span>
                              <span className="text-foreground">
                                {integration.name}
                              </span>
                              <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                {enabledRepos.length}
                              </span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  Select Repository
                                </DropdownMenuLabel>
                              </DropdownMenuGroup>
                              {enabledRepos.map((repo) => {
                                const inContext = isRepoInContext(repo);
                                return (
                                  <DropdownMenuItem
                                    key={repo.id}
                                    onClick={() => {
                                      const item: ContextItem = {
                                        type: "github-repo",
                                        owner: repo.owner,
                                        repo: repo.repo,
                                        integrationId: repo.integrationId,
                                      };
                                      if (inContext) {
                                        removeChipForItem(item);
                                      } else {
                                        insertChipAtCursor(item);
                                      }
                                    }}
                                  >
                                    <Github className="size-4" />
                                    <span className="truncate">
                                      {repo.owner}/{repo.repo}
                                    </span>
                                    {inContext && (
                                      <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                        Added
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                              {organizationSlug && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    render={
                                      <Link
                                        href={`/${organizationSlug}/integrations/github`}
                                      />
                                    }
                                  >
                                    Manage repositories
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      }

                      if (
                        isLinear &&
                        isAvailable &&
                        enabledLinearIntegrations.length > 0
                      ) {
                        return (
                          <DropdownMenuSub key={integration.id}>
                            <DropdownMenuSubTrigger>
                              <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                                {integration.icon}
                              </span>
                              <span className="text-foreground">
                                {integration.name}
                              </span>
                              <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                {enabledLinearIntegrations.length}
                              </span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  Select Integration
                                </DropdownMenuLabel>
                              </DropdownMenuGroup>
                              {enabledLinearIntegrations.map((li) => {
                                const inContext = isLinearInContext(li);
                                return (
                                  <DropdownMenuItem
                                    key={li.id}
                                    onClick={() => {
                                      const item: ContextItem = {
                                        type: "linear-team",
                                        integrationId: li.integrationId,
                                        teamName: li.teamName ?? undefined,
                                      };
                                      if (inContext) {
                                        removeChipForItem(item);
                                      } else {
                                        insertChipAtCursor(item);
                                      }
                                    }}
                                  >
                                    <Linear className="size-4" />
                                    <span className="truncate">
                                      {li.displayName}
                                    </span>
                                    {inContext && (
                                      <span className="ml-auto text-emerald-600 text-xs dark:text-emerald-400">
                                        Added
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                              {organizationSlug && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    render={
                                      <Link
                                        href={`/${organizationSlug}/integrations/linear`}
                                      />
                                    }
                                  >
                                    Manage Linear
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      }

                      if (
                        (isGitHub || isLinear) &&
                        isAvailable &&
                        organizationSlug
                      ) {
                        return (
                          <DropdownMenuItem
                            key={integration.id}
                            render={
                              <Link
                                href={`/${organizationSlug}/integrations/${integration.href}`}
                              />
                            }
                          >
                            <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                              {integration.icon}
                            </span>
                            <span className="text-foreground">
                              {integration.name}
                            </span>
                            <span className="ml-auto text-muted-foreground text-xs">
                              Setup
                            </span>
                            <HugeiconsIcon
                              className="size-4 text-muted-foreground"
                              icon={ArrowRight01Icon}
                              strokeWidth={2}
                            />
                          </DropdownMenuItem>
                        );
                      }

                      return (
                        <DropdownMenuItem
                          className="opacity-60"
                          disabled
                          key={integration.id}
                        >
                          <span className="size-4 shrink-0 text-foreground [&_svg]:size-4">
                            {integration.icon}
                          </span>
                          <span className="text-foreground">
                            {integration.name}
                          </span>
                          <span className="ml-auto text-muted-foreground text-xs">
                            Soon
                          </span>
                          <HugeiconsIcon
                            className="size-4 text-muted-foreground"
                            icon={ArrowRight01Icon}
                            strokeWidth={2}
                          />
                        </DropdownMenuItem>
                      );
                    })}
                    {organizationSlug && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          render={
                            <Link href={`/${organizationSlug}/integrations`} />
                          }
                        >
                          Manage integrations
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-label="Attach files"
                        className="ml-auto size-7 bg-muted p-0 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          isLoading ||
                          isQueued ||
                          attachments.length + pendingUploads.length >=
                            MAX_CHAT_ATTACHMENTS
                        }
                        onClick={() => fileInputRef.current?.click()}
                        size="sm"
                        type="button"
                        variant="outline"
                      />
                    }
                  >
                    <HugeiconsIcon
                      className="size-3.5"
                      icon={Attachment01Icon}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{attachmentTooltipText}</TooltipContent>
                </Tooltip>

                {(() => {
                  const hasAnyContent =
                    !isEmpty ||
                    attachments.length > 0 ||
                    pendingUploads.length > 0;
                  const canQueue =
                    isLoading &&
                    !isEmpty &&
                    attachments.length === 0 &&
                    pendingUploads.length === 0;
                  let submitDisabled: boolean;
                  if (isQueued) {
                    submitDisabled = false;
                  } else if (isLoading && isEmpty) {
                    submitDisabled = !onStop || isStopping;
                  } else if (canQueue) {
                    submitDisabled = false;
                  } else {
                    submitDisabled =
                      isUsageBlocked ||
                      hasUnsupportedAttachmentsForModel ||
                      !hasAnyContent;
                  }
                  let submitOnClick: (() => void) | undefined;
                  if (isQueued) {
                    submitOnClick = () => setPendingSend(null);
                  } else if (isLoading && isEmpty) {
                    submitOnClick = onStop;
                  } else {
                    submitOnClick = handleSend;
                  }
                  return (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            className="group/button h-7 shrink-0 rounded-lg bg-muted px-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={submitDisabled}
                            onClick={submitOnClick}
                            size="sm"
                            tabIndex={0}
                            type="button"
                            variant="outline"
                          />
                        }
                      >
                        <div className="flex items-center gap-1 text-foreground text-sm">
                          <SubmitButtonContent
                            canQueue={canQueue}
                            isEmpty={isEmpty}
                            isLoading={isLoading}
                            isQueued={isQueued}
                            isStopping={isStopping}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getSubmitTooltipText({
                          canQueue,
                          isEmpty,
                          isLoading,
                          isQueued,
                          isStopping,
                        })}
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </CardFooter>
            </section>
          </div>
        </CardContent>
      </Card>
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
