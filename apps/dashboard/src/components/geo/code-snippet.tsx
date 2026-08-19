"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useState } from "react";
import { highlight } from "sugar-high";
import { COPY_FEEDBACK_MS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { CodeSnippetProps } from "@/types/geo";

export function CodeSnippet({ code, className }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <div className={cn("group relative", className)}>
      <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed">
        <code
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high escapes the source before tokenizing
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </pre>
      <Button
        aria-label={copied ? "Snippet copied" : "Copy snippet"}
        className="absolute top-1.5 right-1.5 size-7 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        onClick={handleCopy}
        size="icon"
        type="button"
        variant="ghost"
      >
        <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={14} />
      </Button>
    </div>
  );
}
