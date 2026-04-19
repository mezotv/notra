"use client";

import {
  AiBrain01Icon,
  ArrowRight01Icon,
  AtIcon,
  StopIcon,
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
import Link from "next/link";
import {
  type Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { FEATURES } from "@/constants/features";
import { INPUT_SOURCES } from "@/lib/integrations/catalog";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { ChatInputHandle, ContextItem } from "@/types/chat";
import type { GitHubRepository } from "@/types/integrations";
import {
  buildIntegrationReferenceElement,
  INTEGRATION_REFERENCE_SELECTOR,
  isIntegrationReferenceElement,
  parseIntegrationReferenceElement,
  parseReferenceValue,
  serializeEditorWithReferences,
  serializeFragmentWithReferences,
} from "./integration-reference";

const AVAILABLE_MODELS = [
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

function ModelIcon({
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
  return <ClaudeAiIcon className={className} />;
}

const THINKING_LEVELS = ["off", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

function SubmitButtonContent({
  isLoading,
  isStopping,
}: {
  isLoading: boolean;
  isStopping: boolean;
}) {
  if (isLoading && isStopping) {
    return <Loader2Icon className="size-4 animate-spin" />;
  }
  if (isLoading) {
    return (
      <>
        <HugeiconsIcon className="size-3.5" icon={StopIcon} />
        <div className="px-0.5 text-sm leading-0">Stop</div>
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

function getSubmitTooltipText(isLoading: boolean, isStopping: boolean): string {
  if (isLoading && isStopping) {
    return "Stopping...";
  }
  if (isLoading) {
    return "Stop generating";
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
  onSend?: (value: string) => void;
  onStop?: () => void;
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
  ref?: Ref<ChatInputHandle>;
}

const THINKING_LABELS: Record<ThinkingLevel, string> = {
  off: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function ChatInputAdvanced({
  onSend,
  onStop,
  isLoading = false,
  isStopping = false,
  organizationSlug,
  organizationId,
  context = [],
  onAddContext,
  onRemoveContext,
  error: externalError,
  onClearError,
  model = "anthropic/claude-sonnet-4.6",
  onModelChange,
  thinkingLevel = "medium",
  onThinkingLevelChange,
  ref,
}: ChatInputAdvancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionAnchorRef = useRef<{ node: Node; offset: number } | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const mentionListRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;
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

  const handleSend = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || readEditorText().trim().length === 0 || isLoading) {
      return;
    }
    const outbound = serializeEditorWithReferences(editor).trim();
    if (!outbound) {
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

    onSend?.(outbound);
    editor.innerHTML = "";
    setIsEmpty(true);
    for (const item of contextRef.current) {
      onRemoveContext?.(item);
    }
  }, [
    onSend,
    readEditorText,
    isLoading,
    check,
    customer,
    isUsageBlocked,
    clearError,
    onRemoveContext,
  ]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return;
      }
      const range = sel.getRangeAt(0);
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
      sel.removeAllRanges();
      sel.addRange(after);
      editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    },
    []
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

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === model) ?? AVAILABLE_MODELS[0];

  return (
    <Card
      className="w-full gap-0 overflow-visible rounded-[14px] border-0 bg-background py-0 shadow-none ring-0 transition-shadow duration-200 ease-out-expo"
      data-focused={isFocused ? "true" : "false"}
    >
      <CardHeader className="sr-only">
        <span>Chat input</span>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="rounded-[14px] border border-border bg-background shadow-sm"
          tabIndex={-1}
        >
          <div className="rounded-[13px] p-0.5">
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
                    aria-disabled={isLoading || isUsageBlocked}
                    aria-label="Send a message"
                    aria-multiline="true"
                    className="wrap-break-word relative max-h-50 min-h-12 w-full overflow-y-auto whitespace-pre-wrap rounded-t-[12px] px-3 py-2 text-foreground text-sm leading-6 caret-foreground outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[empty=true]:before:pointer-events-none data-[empty=true]:before:absolute data-[empty=true]:before:top-2 data-[empty=true]:before:left-3 data-[empty=true]:before:text-muted-foreground data-[empty=true]:before:content-[attr(data-placeholder)]"
                    contentEditable={!(isLoading || isUsageBlocked)}
                    data-empty={isEmpty ? "true" : "false"}
                    data-placeholder={
                      isLoading
                        ? "AI is working..."
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
                    tabIndex={isLoading || isUsageBlocked ? -1 : 0}
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
                              <span className="truncate text-sm">{label}</span>
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
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                    />
                  }
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <HugeiconsIcon className="size-3.5" icon={AiBrain01Icon} />
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
                        <span className="ml-auto text-primary text-xs">✓</span>
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
                      disabled={isLoading}
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
                      onClick={() => onModelChange?.(m.id)}
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
                      disabled={isLoading}
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
                      className="group/button ml-auto h-7 shrink-0 rounded-lg bg-muted px-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        isLoading
                          ? !onStop || isStopping
                          : isUsageBlocked || isEmpty
                      }
                      onClick={isLoading ? onStop : handleSend}
                      size="sm"
                      tabIndex={0}
                      type="button"
                      variant="outline"
                    />
                  }
                >
                  <div className="flex items-center gap-1 text-foreground text-sm">
                    <SubmitButtonContent
                      isLoading={isLoading}
                      isStopping={isStopping}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {getSubmitTooltipText(isLoading, isStopping)}
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
