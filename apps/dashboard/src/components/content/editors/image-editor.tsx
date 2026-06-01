"use client";

import { isEmbeddedImageDataUrl } from "@notra/ai/utils/html";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import Image from "next/image";
import type { ContentEditorProps } from "./types";

const MARKDOWN_IMAGE_RE = /!\[[^\]]*]\((data:image\/[^)]+)\)/;
const HTML_IMAGE_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;

function getImageSource(markdown: string): string | null {
  const markdownMatch = markdown.match(MARKDOWN_IMAGE_RE);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }

  const htmlMatch = markdown.match(HTML_IMAGE_SRC_RE);
  if (htmlMatch?.[1] && isEmbeddedImageDataUrl(htmlMatch[1])) {
    return htmlMatch[1];
  }

  return null;
}

export function ImageEditor({ content }: ContentEditorProps) {
  const imageSrc = getImageSource(content.markdown);

  return (
    <TitleCard
      contentClassName="flex min-h-[420px] items-center justify-center overflow-hidden p-0"
      heading={content.title}
    >
      {imageSrc ? (
        <Image
          alt={content.title}
          className="h-auto max-h-[calc(100vh-260px)] w-full object-contain"
          height={630}
          src={imageSrc}
          unoptimized
          width={1200}
        />
      ) : (
        <div className="px-4 py-12 text-center text-muted-foreground text-sm">
          Image data is unavailable.
        </div>
      )}
    </TitleCard>
  );
}
