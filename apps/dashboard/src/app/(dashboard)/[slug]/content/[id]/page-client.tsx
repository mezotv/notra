"use client";

import { useChat } from "@ai-sdk/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { useSidebar } from "@notra/ui/components/ui/sidebar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { DefaultChatTransport } from "ai";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import remend from "remend";
import { toast } from "sonner";
import ChatInput, {
  type ContextItem,
  type TextSelection,
} from "@/components/chat-input";
import { getContentTypeLabel } from "@/components/content/content-card";
import { DiffView } from "@/components/content/diff-view";
import { LexicalEditor } from "@/components/content/editor/lexical-editor";
import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";
import { sourceMetadataSchema } from "@/schemas/content";
import { formatSnakeCaseLabel } from "@/utils/format";
import { useContent } from "../../../../../lib/hooks/use-content";
import { ContentDetailSkeleton } from "./skeleton";

const VIEW_OPTIONS = ["rendered", "markdown", "diff"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const TITLE_REGEX = /^#\s+(.+)$/m;
const VIEW_OPTIONS_SET = new Set<string>(VIEW_OPTIONS);

function isViewOption(value: string): value is ViewOption {
  return VIEW_OPTIONS_SET.has(value);
}

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

interface EditorState {
  editedMarkdown: string | null;
  originalMarkdown: string;
  selection: TextSelection | null;
  editorKey: number;
  context: ContextItem[];
}

type EditorAction =
  | { type: "initialize"; markdown: string }
  | { type: "setEditedMarkdown"; markdown: string | null }
  | { type: "setOriginalMarkdown"; markdown: string }
  | { type: "setSelection"; selection: TextSelection | null }
  | { type: "addContext"; item: ContextItem }
  | { type: "removeContext"; item: ContextItem };

const initialEditorState: EditorState = {
  editedMarkdown: null,
  originalMarkdown: "",
  selection: null,
  editorKey: 0,
  context: [],
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        editedMarkdown: action.markdown,
        originalMarkdown: action.markdown,
        editorKey: state.editorKey + 1,
      };
    case "setEditedMarkdown":
      return { ...state, editedMarkdown: action.markdown };
    case "setOriginalMarkdown":
      return { ...state, originalMarkdown: action.markdown };
    case "setSelection":
      return { ...state, selection: action.selection };
    case "addContext":
      if (
        state.context.some(
          (item) =>
            item.type === action.item.type &&
            item.owner === action.item.owner &&
            item.repo === action.item.repo
        )
      ) {
        return state;
      }
      return { ...state, context: [...state.context, action.item] };
    case "removeContext":
      return {
        ...state,
        context: state.context.filter(
          (item) =>
            item.type !== action.item.type ||
            item.owner !== action.item.owner ||
            item.repo !== action.item.repo
        ),
      };
    default:
      return state;
  }
}

export default function PageClient({
  contentId,
  organizationSlug,
  organizationId,
}: PageClientProps) {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_OPTIONS).withDefault("rendered")
  );

  const { state: sidebarState } = useSidebar();
  const { data, isPending, error } = useContent(organizationId, contentId);
  const { refetch: refetchCustomer } = useCustomer();

  const [editorState, dispatch] = useReducer(editorReducer, initialEditorState);
  const { editedMarkdown, originalMarkdown, selection, editorKey, context } =
    editorState;

  const saveToastIdRef = useRef<string | number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<EditorRefHandle | null>(null);
  const handleSaveRef = useRef<() => void>(() => {});
  const handleDiscardRef = useRef<() => void>(() => {});
  const needsNormalizationRef = useRef(false);
  const originalMarkdownRef = useRef("");
  const editedMarkdownRef = useRef<string | null>(null);

  useEffect(() => {
    if (data?.content && editedMarkdown === null) {
      const markdown = data.content.markdown;
      dispatch({ type: "initialize", markdown });
      originalMarkdownRef.current = markdown;
      editedMarkdownRef.current = markdown;
      needsNormalizationRef.current = true;
    }
  }, [data, editedMarkdown, dispatch]);

  const currentMarkdown = editedMarkdown ?? data?.content?.markdown ?? "";
  const hasChanges =
    editedMarkdown !== null && editedMarkdown !== originalMarkdown;
  const title =
    data?.content?.title || extractTitleFromMarkdown(currentMarkdown);

  const [, setIsSaving] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    // TODO: add client-side route change confirmation for unsaved edits.
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
    if (!editedMarkdown) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/content/${contentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: editedMarkdown }),
        }
      );

      if (response.ok) {
        dispatch({ type: "setOriginalMarkdown", markdown: editedMarkdown });
        originalMarkdownRef.current = editedMarkdown;
        toast.success("Content saved");
      } else {
        toast.error("Failed to save content");
      }
    } catch (err) {
      console.error("Error saving content:", err);
      toast.error("Failed to save content");
    }

    setIsSaving(false);
  }, [editedMarkdown, organizationId, contentId]);

  const handleDiscard = useCallback(() => {
    dispatch({ type: "setEditedMarkdown", markdown: originalMarkdown });
    editedMarkdownRef.current = originalMarkdown;
    editorRef.current?.setMarkdown(originalMarkdown);
  }, [dispatch, originalMarkdown]);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleDiscardRef.current = handleDiscard;
  }, [handleSave, handleDiscard]);

  // Persistent save toast - only create/dismiss based on hasChanges
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

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (saveToastIdRef.current) {
        toast.dismiss(saveToastIdRef.current);
      }
    };
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "setSelection", selection: null });
    window.getSelection()?.removeAllRanges();
  }, [dispatch]);

  const handleAddContext = useCallback(
    (item: ContextItem) => {
      dispatch({ type: "addContext", item });
    },
    [dispatch]
  );

  const handleRemoveContext = useCallback(
    (item: ContextItem) => {
      dispatch({ type: "removeContext", item });
    },
    [dispatch]
  );

  // Handle Lexical editor changes
  const handleEditorChange = useCallback(
    (markdown: string) => {
      if (
        needsNormalizationRef.current &&
        editedMarkdownRef.current === originalMarkdownRef.current
      ) {
        needsNormalizationRef.current = false;
        dispatch({ type: "setOriginalMarkdown", markdown });
        originalMarkdownRef.current = markdown;
      }
      needsNormalizationRef.current = false;
      dispatch({ type: "setEditedMarkdown", markdown });
      editedMarkdownRef.current = markdown;
    },
    [dispatch]
  );

  // Handle Lexical selection
  const handleSelectionChange = useCallback(
    (sel: TextSelection | null) => {
      if (sel && sel.text.length > 0) {
        dispatch({ type: "setSelection", selection: sel });
      }
    },
    [dispatch]
  );

  // Handle textarea selection
  const handleTextareaSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const startOffset = textarea.selectionStart;
    const endOffset = textarea.selectionEnd;
    if (startOffset !== endOffset) {
      const text = textarea.value.substring(startOffset, endOffset).trim();
      if (text) {
        // Calculate line and character positions
        const getLineAndChar = (offset: number) => {
          const lines = textarea.value.substring(0, offset).split("\n");
          return {
            line: lines.length,
            char: (lines.at(-1)?.length ?? 0) + 1,
          };
        };
        const start = getLineAndChar(startOffset);
        const end = getLineAndChar(endOffset);
        dispatch({
          type: "setSelection",
          selection: {
            text,
            startLine: start.line,
            startChar: start.char,
            endLine: end.line,
            endChar: end.char,
          },
        });
      }
    }
  }, []);

  const currentMarkdownRef = useRef(currentMarkdown);
  const selectionRef = useRef<TextSelection | null>(null);
  const contextRef = useRef<ContextItem[]>([]);

  useEffect(() => {
    currentMarkdownRef.current = currentMarkdown;
  }, [currentMarkdown]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const [chatError, setChatError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/organizations/${organizationId}/content/${contentId}/chat`,
      body: () => ({
        currentMarkdown: currentMarkdownRef.current,
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
      } catch {
        // Not a JSON error, fall through
      }

      toast.error("Failed to edit content");
    },
  });

  // Get current status for display - shows AI text or tool status
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
            // Extract tool name from type like "tool-getMarkdown" -> "getMarkdown"
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

  // Track processed tool calls to avoid duplicate updates
  const processedToolCallsRef = useRef<Set<string>>(new Set());

  // Watch for tool results and update the editor
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

            // Skip if already processed
            if (processedToolCallsRef.current.has(toolPart.toolCallId)) {
              continue;
            }

            if (
              toolPart.state === "output-available" &&
              toolPart.output?.updatedMarkdown
            ) {
              processedToolCallsRef.current.add(toolPart.toolCallId);
              // Use remend to fix any incomplete markdown syntax
              const fixedMarkdown = remend(toolPart.output.updatedMarkdown);
              console.log(
                `[Tool] editMarkdown result applied, toolCallId=${toolPart.toolCallId}`
              );
              dispatch({ type: "setEditedMarkdown", markdown: fixedMarkdown });
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

        <Tabs
          className="w-full"
          onValueChange={(value) => {
            if (isViewOption(value)) {
              setView(value);
            }
          }}
          value={view}
        >
          <TitleCard
            action={
              <TabsList variant="line">
                <TabsTrigger value="rendered">Rendered</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="diff">
                  Diff
                  {hasChanges && (
                    <span className="ml-1.5 size-2 rounded-full bg-primary" />
                  )}
                </TabsTrigger>
              </TabsList>
            }
            heading={title}
          >
            <TabsContent
              className="prose prose-neutral dark:prose-invert mt-0 max-w-none"
              value="rendered"
            >
              {currentMarkdown && (
                <LexicalEditor
                  editorRef={editorRef}
                  initialMarkdown={currentMarkdown}
                  key={editorKey}
                  onChange={handleEditorChange}
                  onSelectionChange={handleSelectionChange}
                />
              )}
            </TabsContent>
            <TabsContent className="mt-0" value="markdown">
              <textarea
                aria-label="Markdown content editor"
                className="field-sizing-content w-full resize-none whitespace-pre-wrap rounded-lg border-0 bg-transparent font-mono text-sm selection:bg-primary/30 focus:outline-none focus:ring-0"
                onChange={(e) => {
                  dispatch({
                    type: "setEditedMarkdown",
                    markdown: e.target.value,
                  });
                  editedMarkdownRef.current = e.target.value;
                }}
                onMouseUp={handleTextareaSelect}
                onSelect={handleTextareaSelect}
                ref={textareaRef}
                value={currentMarkdown}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="diff">
              <DiffView
                currentMarkdown={currentMarkdown}
                originalMarkdown={originalMarkdown}
              />
            </TabsContent>
          </TitleCard>
        </Tabs>

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
