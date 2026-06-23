"use client";

import { useEffect, useRef, useState } from "react";
import { toSafeHtml } from "@/lib/html-to-figma/sanitize";
import type { HtmlPreviewProps } from "@/types/html-to-figma";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;

export default function HtmlPreview({ html }: HtmlPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      setScale(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const trimmed = html.trim();
  const srcDoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}body{width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px;display:flex;overflow:hidden;background:#ffffff}</style></head><body>${toSafeHtml(trimmed)}</body></html>`;

  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 sm:p-6"
      ref={containerRef}
    >
      {trimmed ? (
        <div
          className="overflow-hidden rounded-lg ring-1 ring-border"
          style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
        >
          <iframe
            className="origin-top-left border-0"
            sandbox=""
            srcDoc={srcDoc}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${scale})`,
            }}
            title="HTML preview"
          />
        </div>
      ) : (
        <p className="font-mono text-muted-foreground text-sm">
          Paste HTML to see a preview
        </p>
      )}
    </div>
  );
}
