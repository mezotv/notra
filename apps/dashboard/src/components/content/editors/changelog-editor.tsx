"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useRef } from "react";
import { DiffView } from "@/components/content/diff-view";
import { LexicalEditor } from "@/components/content/editor/lexical-editor";
import type { ContentEditorProps } from "./types";

const VIEW_OPTIONS = ["rendered", "markdown", "diff"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const VIEW_OPTIONS_SET = new Set<string>(VIEW_OPTIONS);

function isViewOption(value: string): value is ViewOption {
  return VIEW_OPTIONS_SET.has(value);
}

export function ChangelogEditor({
  content,
  state,
  actions,
  editorRef,
  editorKey,
}: ContentEditorProps) {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_OPTIONS).withDefault("rendered")
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const currentMarkdown = state.editedMarkdown ?? content.markdown;
  const title = state.editingTitle ?? state.serverTitle;

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
        const getLineAndChar = (offset: number) => {
          const lines = textarea.value.substring(0, offset).split("\n");
          return {
            line: lines.length,
            char: (lines.at(-1)?.length ?? 0) + 1,
          };
        };
        const start = getLineAndChar(startOffset);
        const end = getLineAndChar(endOffset);
        actions.onSelectionChange({
          text,
          startLine: start.line,
          startChar: start.char,
          endLine: end.line,
          endChar: end.char,
        });
      }
    }
  }, [actions]);

  return (
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
              {state.hasChanges && (
                <span className="ml-1.5 size-2 rounded-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        }
        heading={
          <input
            aria-label="Post title"
            className="w-full bg-transparent outline-none focus:ring-0"
            onChange={(e) => actions.setEditingTitle(e.target.value)}
            onFocus={(e) => {
              if (state.editingTitle === null) {
                actions.setEditingTitle(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                titleInputRef.current?.blur();
              }
              if (e.key === "Escape") {
                actions.setEditingTitle(null);
                titleInputRef.current?.blur();
              }
            }}
            ref={titleInputRef}
            type="text"
            value={title}
          />
        }
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
              onChange={actions.onEditorChange}
              onSelectionChange={actions.onSelectionChange}
            />
          )}
        </TabsContent>
        <TabsContent className="mt-0" value="markdown">
          <textarea
            aria-label="Markdown content editor"
            className="field-sizing-content w-full resize-none whitespace-pre-wrap rounded-lg border-0 bg-transparent font-mono text-sm selection:bg-primary/30 focus:outline-none focus:ring-0"
            onChange={(e) => {
              actions.setEditedMarkdown(e.target.value);
            }}
            onMouseUp={handleTextareaSelect}
            onSelect={handleTextareaSelect}
            ref={textareaRef}
            value={currentMarkdown}
          />
        </TabsContent>
        <TabsContent className="mt-0 space-y-4" value="diff">
          {state.hasTitleChanges && (
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Title
              </p>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="mb-1 text-muted-foreground text-xs">Original</p>
                  <p className="wrap-break-word rounded bg-red-500/10 px-2 py-1">
                    {state.serverTitle}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-muted-foreground text-xs">Current</p>
                  <p className="wrap-break-word rounded bg-green-500/10 px-2 py-1">
                    {title}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Content
            </p>
            <DiffView
              currentMarkdown={currentMarkdown}
              originalMarkdown={state.originalMarkdown}
            />
          </div>
        </TabsContent>
      </TitleCard>
    </Tabs>
  );
}
