"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useRef } from "react";
import { DiffView } from "@/components/content/diff-view";
import { blogEditorTheme } from "@/components/content/editor/blog-editor-theme";
import { LexicalEditor } from "@/components/content/editor/lexical-editor";
import {
  CONTENT_EDITOR_VIEWS,
  type ContentEditorView,
} from "@/constants/content-editor-view";
import { cn } from "@/lib/utils";
import { formatArticleDate } from "@/utils/format";
import type { ContentEditorProps } from "./types";

const VIEW_LABELS: Record<ContentEditorView, string> = {
  rendered: "Write",
  markdown: "Markdown",
  diff: "Diff",
};

export function BlogEditor({
  content,
  state,
  actions,
  readOnly = false,
  editorRef,
  editorKey,
}: ContentEditorProps) {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(CONTENT_EDITOR_VIEWS).withDefault("rendered")
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const slugInputRef = useRef<HTMLTextAreaElement>(null);

  const currentMarkdown = state.editedMarkdown ?? content.markdown ?? "";
  const title = state.editingTitle ?? state.serverTitle;
  const slug = state.editingSlug ?? state.serverSlug ?? "";

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
    <div className="w-full">
      <textarea
        aria-label="Post title"
        className="field-sizing-content block w-full resize-none overflow-hidden bg-transparent font-semibold text-3xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40 focus:ring-0 md:text-4xl"
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
        placeholder="Untitled"
        readOnly={readOnly}
        ref={titleInputRef}
        rows={1}
        value={title}
      />
      <div className="mt-3 flex items-start gap-1 font-mono text-muted-foreground text-xs">
        <span className="shrink-0 leading-5">/</span>
        <textarea
          aria-label="Post slug"
          className="field-sizing-content min-w-0 flex-1 resize-none overflow-hidden break-all bg-transparent leading-5 outline-none placeholder:text-muted-foreground/50 focus:text-foreground focus:ring-0"
          onBlur={() => {
            if (state.editingSlug !== null) {
              actions.setEditingSlug(state.editingSlug.replace(/^-+|-+$/g, ""));
            }
          }}
          onChange={(e) => {
            const nextSlug = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-");
            actions.setEditingSlug(nextSlug);
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
          rows={1}
          value={slug}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <time className="text-muted-foreground text-sm" dateTime={content.date}>
          {formatArticleDate(new Date(content.date))}
        </time>
        <div className="flex items-center gap-3">
          {CONTENT_EDITOR_VIEWS.map((option) => (
            <button
              className={cn(
                "text-xs transition-colors",
                view === option
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              key={option}
              onClick={() => {
                setView(option).catch(() => undefined);
              }}
              type="button"
            >
              {VIEW_LABELS[option]}
              {option === "diff" && state.hasChanges ? (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {view === "rendered" ? (
        <div className="[&_.draggable-block-menu]:-left-6 mt-8">
          <LexicalEditor
            className="min-h-[24rem]"
            editable={!readOnly}
            editorRef={editorRef}
            initialMarkdown={currentMarkdown}
            key={editorKey}
            onChange={actions.onEditorChange}
            onSelectionChange={actions.onSelectionChange}
            theme={blogEditorTheme}
          />
        </div>
      ) : null}

      {view === "markdown" ? (
        <textarea
          aria-label="Markdown content editor"
          className="field-sizing-content mt-8 min-h-[24rem] w-full resize-none overflow-hidden whitespace-pre-wrap border-0 bg-transparent font-mono text-sm outline-none selection:bg-primary/30 focus:ring-0"
          onChange={(e) => {
            actions.setEditedMarkdown(e.target.value);
          }}
          onMouseUp={handleTextareaSelect}
          onSelect={handleTextareaSelect}
          readOnly={readOnly}
          ref={textareaRef}
          value={currentMarkdown}
        />
      ) : null}

      {view === "diff" ? (
        <div className="mt-8 space-y-4">
          {state.hasTitleChanges ? (
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
          ) : null}
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Content
            </p>
            <DiffView
              currentMarkdown={currentMarkdown}
              originalMarkdown={state.originalMarkdown}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
