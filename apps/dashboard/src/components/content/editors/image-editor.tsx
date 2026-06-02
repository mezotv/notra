"use client";

import { TitleCard } from "@notra/ui/components/ui/title-card";
import Image from "next/image";
import { extractMarkdownImageSrc } from "@/utils/markdown-image";
import type { ContentEditorProps } from "./types";

const HTTP_URL_RE = /^https?:\/\//i;

function getArtifactHtml(sourceMetadata: unknown): string | null {
  if (
    !sourceMetadata ||
    typeof sourceMetadata !== "object" ||
    Array.isArray(sourceMetadata)
  ) {
    return null;
  }

  const artifacts = (sourceMetadata as { artifacts?: unknown }).artifacts;
  if (!artifacts || typeof artifacts !== "object" || Array.isArray(artifacts)) {
    return null;
  }

  const html = (artifacts as { html?: unknown }).html;
  return typeof html === "string" && html.trim() ? html : null;
}

function getExportHtml(content: ContentEditorProps["content"]): string | null {
  if (content.rawHtml?.trim()) {
    return content.rawHtml;
  }

  const persistedHtml = content.content.trim();
  if (
    persistedHtml.startsWith("<") &&
    !persistedHtml.startsWith("<p>Generated image:")
  ) {
    return persistedHtml;
  }

  return getArtifactHtml(content.sourceMetadata);
}

function getImageSrc(content: ContentEditorProps["content"]): string | null {
  if (HTTP_URL_RE.test(content.content)) {
    return content.content;
  }

  return extractMarkdownImageSrc(content.markdown ?? "");
}

export function ImageEditor({ content, imageExportRef }: ContentEditorProps) {
  const imageSrc = getImageSrc(content);
  const exportHtml = getExportHtml(content);

  return (
    <>
      <TitleCard
        contentClassName="flex min-h-[420px] items-center justify-center overflow-hidden p-0"
        heading={content.title}
      >
        {imageSrc ? (
          <div
            className="flex w-full items-center justify-center"
            ref={exportHtml ? undefined : imageExportRef}
          >
            <Image
              alt={content.title}
              className="h-auto max-h-[calc(100vh-260px)] w-full object-contain"
              height={630}
              src={imageSrc}
              unoptimized
              width={1200}
            />
          </div>
        ) : (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
            Image data is unavailable.
          </div>
        )}
      </TitleCard>
      {exportHtml ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-[-10000px] h-[630px] w-[1200px] overflow-hidden"
          dangerouslySetInnerHTML={{ __html: exportHtml }}
          ref={imageExportRef}
        />
      ) : null}
    </>
  );
}
