"use client";

import { supportsPostSlug } from "@notra/ai/schemas/post";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef } from "react";

import { LexicalEditor } from "@/components/content/editor/lexical-editor";
import { buildReviewMarkdown } from "@/utils/review-markdown";

import type { ContentEditorProps } from "./types";

const VIEW_OPTIONS = ["rendered", "markdown"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const VIEW_OPTIONS_SET = new Set<string>(VIEW_OPTIONS);

function isViewOption(value: string): value is ViewOption {
  return VIEW_OPTIONS_SET.has(value);
}

export function ChangelogEditor({
  content,
  state,
  actions,
  readOnly = false,
  editorRef,
  editorKey,
  writeFocusNonce = 0,
  reviewPreviousMarkdown = null,
}: ContentEditorProps) {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_OPTIONS).withDefault("rendered")
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (writeFocusNonce === 0) {
      return;
    }
    setView("rendered").catch(() => undefined);
  }, [setView, writeFocusNonce]);

  const currentMarkdown = state.editedMarkdown ?? content.markdown ?? "";
  const writeMarkdown = reviewPreviousMarkdown
    ? buildReviewMarkdown(reviewPreviousMarkdown, currentMarkdown)
    : currentMarkdown;
  const title = state.editingTitle ?? state.serverTitle;
  const slug = state.editingSlug ?? state.serverSlug ?? "";
  const showSlug = supportsPostSlug(content.contentType);

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
        if (!isViewOption(value)) {
          return;
        }
        setView(value);
      }}
      value={view}
    >
      <TitleCard
        action={
          <TabsList variant="line">
            <TabsTrigger value="rendered">Rendered</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
        }
        className={
          showSlug
            ? "[&_p.truncate]:overflow-visible [&_p.truncate]:text-clip [&_p.truncate]:whitespace-normal"
            : undefined
        }
        heading={
          showSlug ? (
            <span className="flex flex-col gap-0.5">
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
                readOnly={readOnly}
                ref={titleInputRef}
                type="text"
                value={title}
              />
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground shrink-0 font-mono text-xs">
                  /
                </span>
                <input
                  aria-label="Post slug"
                  className="text-muted-foreground placeholder:text-muted-foreground/50 focus:text-foreground w-full bg-transparent font-mono text-xs outline-none focus:ring-0"
                  onBlur={() => {
                    if (state.editingSlug !== null) {
                      actions.setEditingSlug(
                        state.editingSlug.replace(/^-+|-+$/g, "")
                      );
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-");
                    actions.setEditingSlug(v);
                  }}
                  onFocus={() => {
                    if (state.editingSlug === null) {
                      actions.setEditingSlug(slug);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      slugInputRef.current?.blur();
                    }
                    if (e.key === "Escape") {
                      actions.setEditingSlug(null);
                      slugInputRef.current?.blur();
                    }
                  }}
                  placeholder="add-a-slug"
                  readOnly={readOnly}
                  ref={slugInputRef}
                  type="text"
                  value={slug}
                />
              </span>
            </span>
          ) : (
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
              readOnly={readOnly}
              ref={titleInputRef}
              type="text"
              value={title}
            />
          )
        }
      >
        <TabsContent
          className="prose prose-neutral dark:prose-invert mt-0 max-w-none"
          value="rendered"
        >
          {currentMarkdown ? (
            <LexicalEditor
              cleanReviewMarks={Boolean(reviewPreviousMarkdown)}
              editable={!readOnly}
              editorRef={editorRef}
              initialMarkdown={writeMarkdown}
              key={editorKey}
              onChange={actions.onEditorChange}
              onSelectionChange={actions.onSelectionChange}
            />
          ) : null}
        </TabsContent>
        <TabsContent className="mt-0" value="markdown">
          <textarea
            aria-label="Markdown content editor"
            className="selection:bg-primary/30 field-sizing-content w-full resize-none rounded-lg border-0 bg-transparent font-mono text-sm whitespace-pre-wrap focus:ring-0 focus:outline-none"
            onChange={(e) => {
              actions.setEditedMarkdown(e.target.value);
            }}
            onMouseUp={handleTextareaSelect}
            onSelect={handleTextareaSelect}
            readOnly={readOnly}
            ref={textareaRef}
            value={currentMarkdown}
          />
        </TabsContent>
      </TitleCard>
    </Tabs>
  );
}
