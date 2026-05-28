"use client";

import { useEffect, useRef } from "react";
import { ChangelogHtmlArticle } from "@/components/changelog-html-article";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import type { BlogArticleProps } from "~types/blog";

const COPY_BUTTON_SELECTOR = "[data-copy-code]";

export function BlogArticle({ html }: BlogArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    async function handleCopyClick(event: MouseEvent) {
      const { target } = event;

      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest(COPY_BUTTON_SELECTOR);

      if (!button) {
        return;
      }

      const code =
        button.parentElement?.querySelector("code")?.textContent ?? "";

      await copyToClipboard(code, "Copied to clipboard");
    }

    container.addEventListener("click", handleCopyClick);

    return () => {
      container.removeEventListener("click", handleCopyClick);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <ChangelogHtmlArticle html={html} />
    </div>
  );
}
