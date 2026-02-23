"use client";

import { useChat } from "@ai-sdk/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { useSidebar } from "@notra/ui/components/ui/sidebar";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { DefaultChatTransport } from "ai";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";
import remend from "remend";
import { toast } from "sonner";
import ChatInput, {
  type ContextItem,
  type TextSelection,
} from "@/components/chat-input";
import { getContentTypeLabel } from "@/components/content/content-card";
import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";
import { ContentEditorSwitch } from "@/components/content/editors";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { sourceMetadataSchema } from "@/schemas/content";
import { formatSnakeCaseLabel } from "@/utils/format";
import { useContent } from "../../../../../lib/hooks/use-content";
import { ContentDetailSkeleton } from "./skeleton";

const TITLE_REGEX = /^#\s+(.+)$/m;

interface PageClientProps {
  contentId: string;
  organizationSlug: string;
  organizationId: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function extractTitleFromMarkdown(markdown: string): string {
  const match = markdown.match(TITLE_REGEX);
  return match?.[1] ?? "Untitled";
}

function formatLookbackWindow(window: string): string {
  return formatSnakeCaseLabel(window);
}

function formatDateRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function formatTriggerType(type: string): string {
  return formatSnakeCaseLabel(type);
}

function formatRepos(repos: { owner: string; repo: string }[]): string {
  if (repos.length === 1 && repos[0]) {
    return `${repos[0].owner}/${repos[0].repo}`;
  }
  return `${repos.length} repositories`;
}

export default function PageClient({
  contentId,
  organizationSlug,
  organizationId,
}: PageClientProps) {
  const { state: sidebarState } = useSidebar();
  const { data, isPending, error } = useContent(organizationId, contentId);
  const { refetch: refetchCustomer } = useCustomer();
  const { activeOrganization } = useOrganizationsContext();

  const [editedMarkdown, setEditedMarkdown] = useState<string | null>(null);
  const [originalMarkdown, setOriginalMarkdown] = useState("");
  const [persistedTitle, setPersistedTitle] = useState<string | null>(null);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [context, setContext] = useState<ContextItem[]>([]);

  const saveToastIdRef = useRef<string | number | null>(null);
  const editorRef = useRef<EditorRefHandle | null>(null);
  const handleSaveRef = useRef<() => void>(() => {});
  const handleDiscardRef = useRef<() => void>(() => {});
  const needsNormalizationRef = useRef(false);
  const originalMarkdownRef = useRef("");
  const editedMarkdownRef = useRef<string | null>(null);

  useEffect(() => {
    if (data?.content && editedMarkdown === null) {
      setEditedMarkdown(data.content.markdown);
      setOriginalMarkdown(data.content.markdown);
      originalMarkdownRef.current = data.content.markdown;
      editedMarkdownRef.current = data.content.markdown;
      needsNormalizationRef.current = true;
      setEditorKey((k) => k + 1);
    }
  }, [data, editedMarkdown]);

  const currentMarkdown = editedMarkdown ?? data?.content?.markdown ?? "";
  useEffect(() => {
    setPersistedTitle(data?.content?.title ?? null);
  }, [contentId, data?.content?.title]);

  const serverTitle =
    persistedTitle ??
    data?.content?.title ??
    extractTitleFromMarkdown(currentMarkdown);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const title = editingTitle ?? serverTitle;
  const hasTitleChanges =
    editingTitle !== null && editingTitle.trim() !== serverTitle;
  const hasMarkdownChanges =
    editedMarkdown !== null && editedMarkdown !== originalMarkdown;
  const hasChanges = hasMarkdownChanges || hasTitleChanges;

  const [, setIsSaving] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    try {
      const body: Record<string, string> = {};
      if (hasTitleChanges) {
        body.title = title.trim();
      }
      if (editedMarkdown) {
        body.markdown = editedMarkdown;
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/content/${contentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const responseData = (await response.json()) as {
        content?: { title?: string };
      };

      if (editedMarkdown) {
        setOriginalMarkdown(editedMarkdown);
        originalMarkdownRef.current = editedMarkdown;
      }
      setPersistedTitle(responseData.content?.title ?? title.trim());
      setEditingTitle(null);
      toast.success("Content saved");
    } catch {
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  }, [
    hasChanges,
    hasTitleChanges,
    title,
    editedMarkdown,
    organizationId,
    contentId,
  ]);

  const handleDiscard = useCallback(() => {
    setEditedMarkdown(originalMarkdown);
    editedMarkdownRef.current = originalMarkdown;
    editorRef.current?.setMarkdown(originalMarkdown);
    setEditingTitle(null);
  }, [originalMarkdown]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleDiscardRef.current = handleDiscard;
  }, [handleSave, handleDiscard]);

  useEffect(() => {
    if (hasChanges && !saveToastIdRef.current) {
      saveToastIdRef.current = toast.custom(
        (t) => (
          <div className="rounded-[14px] border border-border bg-background p-0.5 shadow-sm">
            <div className="flex items-center gap-3 rounded-[12px] bg-background px-4 py-3">
              <span className="text-muted-foreground text-sm">
                Unsaved changes
              </span>
              <Button
                onClick={() => {
                  handleDiscardRef.current();
                  toast.dismiss(t);
                }}
                size="sm"
                variant="ghost"
              >
                Discard
              </Button>
              <Button
                onClick={() => {
                  handleSaveRef.current();
                  toast.dismiss(t);
                }}
                size="sm"
              >
                Save
              </Button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "bottom-right" }
      );
    } else if (!hasChanges && saveToastIdRef.current) {
      toast.dismiss(saveToastIdRef.current);
      saveToastIdRef.current = null;
    }
  }, [hasChanges]);

  useEffect(() => {
    return () => {
      if (saveToastIdRef.current) {
        toast.dismiss(saveToastIdRef.current);
      }
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleAddContext = useCallback((item: ContextItem) => {
    setContext((prev) => {
      if (
        prev.some(
          (c) =>
            c.type === item.type &&
            c.owner === item.owner &&
            c.repo === item.repo
        )
      ) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveContext = useCallback((item: ContextItem) => {
    setContext((prev) =>
      prev.filter(
        (c) =>
          !(
            c.type === item.type &&
            c.owner === item.owner &&
            c.repo === item.repo
          )
      )
    );
  }, []);

  const handleEditorChange = useCallback((markdown: string) => {
    if (
      needsNormalizationRef.current &&
      editedMarkdownRef.current === originalMarkdownRef.current
    ) {
      needsNormalizationRef.current = false;
      setOriginalMarkdown(markdown);
      originalMarkdownRef.current = markdown;
    }
    needsNormalizationRef.current = false;
    setEditedMarkdown(markdown);
    editedMarkdownRef.current = markdown;
  }, []);

  const handleSelectionChange = useCallback((sel: TextSelection | null) => {
    if (sel && sel.text.length > 0) {
      setSelection(sel);
    }
  }, []);

  const currentMarkdownRef = useRef(currentMarkdown);
  const selectionRef = useRef(selection);
  const contextRef = useRef(context);
  const contentTypeRef = useRef(data?.content?.contentType);
  currentMarkdownRef.current = currentMarkdown;
  selectionRef.current = selection;
  contextRef.current = context;
  contentTypeRef.current = data?.content?.contentType;

  const [chatError, setChatError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/organizations/${organizationId}/content/${contentId}/chat`,
      body: () => ({
        currentMarkdown: currentMarkdownRef.current,
        contentType: contentTypeRef.current,
        selection: selectionRef.current ?? undefined,
        context: contextRef.current,
      }),
    }),
    onFinish: () => {
      clearSelection();
      refetchCustomer();
    },
    onError: (err) => {
      console.error("Error editing content:", err);

      const errorMessage = err.message || String(err);

      if (
        errorMessage.includes("USAGE_LIMIT_REACHED") ||
        errorMessage.includes("Usage limit reached")
      ) {
        setChatError(
          "You've used all your chat messages this month. Upgrade for more."
        );
        return;
      }

      try {
        const errorData = JSON.parse(errorMessage);
        if (errorData.code === "USAGE_LIMIT_REACHED") {
          setChatError(
            "You've used all your chat messages this month. Upgrade for more."
          );
          return;
        }
      } catch {}

      toast.error("Failed to edit content");
    },
  });

  const currentToolStatus = (() => {
    const toolNames: Record<string, string> = {
      getMarkdown: "Reading document...",
      editMarkdown: "Editing document...",
      listAvailableSkills: "Checking skills...",
      getSkillByName: "Loading skill...",
    };

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message?.role === "assistant" && message.parts) {
        for (let j = message.parts.length - 1; j >= 0; j--) {
          const part = message.parts[j];
          if (!part) {
            continue;
          }
          if (part.type === "text" && part.text?.trim()) {
            return part.text.trim();
          }
          if (part.type.startsWith("tool-")) {
            const toolPart = part as { state: string };
            const toolName = part.type.replace("tool-", "");
            if (
              toolPart.state === "input-streaming" ||
              toolPart.state === "input-available"
            ) {
              return toolNames[toolName] || `Running ${toolName}...`;
            }
          }
        }
      }
    }
    return undefined;
  })();

  const processedToolCallsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const message of messages) {
      if (message.role === "assistant" && message.parts) {
        for (const part of message.parts) {
          if (part.type === "tool-editMarkdown") {
            const toolPart = part as {
              toolCallId: string;
              state: string;
              output?: { updatedMarkdown?: string };
            };

            if (processedToolCallsRef.current.has(toolPart.toolCallId)) {
              continue;
            }

            if (
              toolPart.state === "output-available" &&
              toolPart.output?.updatedMarkdown
            ) {
              processedToolCallsRef.current.add(toolPart.toolCallId);
              const fixedMarkdown = remend(toolPart.output.updatedMarkdown);
              console.log(
                `[Tool] editMarkdown result applied, toolCallId=${toolPart.toolCallId}`
              );
              setEditedMarkdown(fixedMarkdown);
              editedMarkdownRef.current = fixedMarkdown;
              editorRef.current?.setMarkdown(fixedMarkdown);
            }
          }
        }
      }
    }
  }, [messages]);

  const handleAiEdit = useCallback(
    async (instruction: string) => {
      await sendMessage({ text: instruction });
    },
    [sendMessage]
  );

  if (isPending) {
    return <ContentDetailSkeleton />;
  }

  if (error || !data?.content) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 lg:px-6">
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h3 className="font-medium text-lg">Content not found</h3>
            <p className="text-muted-foreground text-sm">
              This content may have been deleted or you don't have access to it.
            </p>
            <Link
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/${organizationSlug}/content`}
            >
              <Button className="mt-4" tabIndex={-1} variant="outline">
                Back to Content
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const content = data.content;

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Link
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/${organizationSlug}/content`}
          >
            <Button size="sm" tabIndex={-1} variant="ghost">
              <svg
                className="mr-2 size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Back arrow</title>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Back to Content
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <time
                className="text-muted-foreground text-sm"
                dateTime={content.date}
              >
                {formatDate(new Date(content.date))}
              </time>
              <Badge className="capitalize" variant="secondary">
                {getContentTypeLabel(content.contentType)}
              </Badge>
            </div>
            {content.sourceMetadata &&
              (() => {
                const parsed = sourceMetadataSchema.safeParse(
                  content.sourceMetadata
                );
                if (!parsed.success || !parsed.data) {
                  return null;
                }
                const meta = parsed.data;
                const repoLabel = formatRepos(meta.repositories);
                const needsTooltip = meta.repositories.length > 1;
                return (
                  <p className="text-muted-foreground text-xs">
                    <span className="capitalize">
                      {formatTriggerType(meta.triggerSourceType)}
                    </span>
                    {" \u00B7 "}
                    {needsTooltip ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="cursor-help underline decoration-dotted underline-offset-2">
                              {repoLabel}
                            </span>
                          }
                        />
                        <TooltipContent>
                          <ul>
                            {meta.repositories.map((r) => (
                              <li key={`${r.owner}/${r.repo}`}>
                                {r.owner}/{r.repo}
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      repoLabel
                    )}
                    {" \u00B7 "}
                    <span className="capitalize">
                      {formatLookbackWindow(meta.lookbackWindow)}
                    </span>{" "}
                    (
                    {formatDateRange(
                      meta.lookbackRange.start,
                      meta.lookbackRange.end
                    )}
                    )
                  </p>
                );
              })()}
          </div>
        </div>

        <ContentEditorSwitch
          actions={{
            setEditedMarkdown: (markdown) => {
              setEditedMarkdown(markdown);
              if (markdown !== null) {
                editedMarkdownRef.current = markdown;
              }
            },
            setOriginalMarkdown,
            setEditingTitle,
            onEditorChange: handleEditorChange,
            onSelectionChange: handleSelectionChange,
          }}
          content={{
            id: content.id,
            title: content.title,
            markdown: content.markdown,
            contentType: content.contentType,
            date: content.date,
            sourceMetadata: content.sourceMetadata,
          }}
          contentType={content.contentType}
          editorKey={editorKey}
          editorRef={editorRef}
          organization={{
            name: activeOrganization?.name ?? "Your Organization",
            logo: activeOrganization?.logo ?? null,
          }}
          state={{
            editedMarkdown,
            originalMarkdown,
            editingTitle,
            serverTitle,
            hasChanges,
            hasMarkdownChanges,
            hasTitleChanges,
          }}
        />

        <div className="h-24" />
      </div>

      <div
        className={`fixed right-0 bottom-0 left-0 mx-auto w-full max-w-2xl px-4 pb-4 md:w-auto ${sidebarState === "collapsed" ? "md:left-14" : "md:left-64"}`}
      >
        <ChatInput
          context={context}
          error={chatError}
          isLoading={status === "streaming" || status === "submitted"}
          onAddContext={handleAddContext}
          onClearError={() => setChatError(null)}
          onClearSelection={clearSelection}
          onRemoveContext={handleRemoveContext}
          onSend={handleAiEdit}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          selection={selection}
          statusText={currentToolStatus}
        />
      </div>
    </div>
  );
}
