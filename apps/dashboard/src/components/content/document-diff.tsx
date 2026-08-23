"use client";

import { cn } from "@notra/ui/lib/utils";
import type { FileContents, FileDiffOptions } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  DOCUMENT_DIFF_HIDDEN_ICON_CSS,
  DOCUMENT_DIFF_THEME,
} from "@/constants/document-diff";
import type { DocumentDiffProps } from "@/types/content/document-diff";

export function DocumentDiff({
  filename,
  previousMarkdown,
  updatedMarkdown,
  hideFileHeader = false,
  className,
}: DocumentDiffProps) {
  const { resolvedTheme } = useTheme();
  const themeType = resolvedTheme === "dark" ? "dark" : "light";

  const oldFile = useMemo<FileContents>(
    () => ({
      name: filename,
      contents: previousMarkdown,
    }),
    [filename, previousMarkdown]
  );
  const newFile = useMemo<FileContents>(
    () => ({
      name: filename,
      contents: updatedMarkdown,
    }),
    [filename, updatedMarkdown]
  );
  const options = useMemo<FileDiffOptions<undefined>>(
    () => ({
      theme: DOCUMENT_DIFF_THEME,
      themeType,
      diffStyle: "unified",
      diffIndicators: "classic",
      hunkSeparators: "line-info",
      overflow: "wrap",
      disableBackground: false,
      lineDiffType: "word-alt",
      disableFileHeader: hideFileHeader,
      unsafeCSS: DOCUMENT_DIFF_HIDDEN_ICON_CSS,
    }),
    [hideFileHeader, themeType]
  );

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-background",
        className
      )}
    >
      <MultiFileDiff
        disableWorkerPool
        newFile={newFile}
        oldFile={oldFile}
        options={options}
      />
    </div>
  );
}
