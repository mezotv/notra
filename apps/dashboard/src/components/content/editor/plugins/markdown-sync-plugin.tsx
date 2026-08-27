"use client";

import type { Transformer } from "@lexical/markdown";
import { $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

import { stripReviewMarks } from "@/utils/review-markdown";

interface MarkdownSyncPluginProps {
  onChange: (markdown: string) => void;
  transformers: Transformer[];
  cleanReviewMarks?: boolean;
}

export function MarkdownSyncPlugin({
  onChange,
  transformers,
  cleanReviewMarks = false,
}: MarkdownSyncPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(transformers);
        onChange(cleanReviewMarks ? stripReviewMarks(markdown) : markdown);
      });
    });
  }, [cleanReviewMarks, editor, onChange, transformers]);

  return null;
}
