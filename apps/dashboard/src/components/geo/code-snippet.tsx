"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { highlight } from "sugar-high";
import { Button } from "@/components/button";
import { COPY_FEEDBACK_MS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { CodeSnippetProps } from "@/types/geo";

export function useCopyCode(code: string) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copied = copiedCode === code;

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  const copy = async () => {
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard not supported");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      toast.error("Failed to copy to clipboard");
      return;
    }

    setCopiedCode(code);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setCopiedCode(null), COPY_FEEDBACK_MS);
  };

  return { copied, copy };
}

function CopyCodeButton({ code, label }: { code: string; label: string }) {
  const { copied, copy } = useCopyCode(code);

  return (
    <Button
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="shrink-0 text-muted-foreground"
      onClick={copy}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={14} />
    </Button>
  );
}

function CommandSnippet({
  code,
  className,
}: Pick<CodeSnippetProps, "code" | "className">) {
  return (
    <div
      className={cn(
        "flex h-9 min-w-0 items-center rounded-lg border border-border/60 bg-muted/40 ps-3 pe-1",
        className
      )}
    >
      <input
        aria-label="Package install command"
        className="h-full min-w-0 flex-1 cursor-text appearance-none border-0 bg-transparent p-0 font-mono text-foreground text-xs leading-none shadow-none outline-none"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        value={code}
      />
      <CopyCodeButton code={code} label="command" />
    </div>
  );
}

export function CodeSnippet({
  code,
  className,
  filename,
  headerEnd,
  variant = "panel",
}: CodeSnippetProps) {
  if (variant === "command") {
    return <CommandSnippet className={className} code={code} />;
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="overflow-hidden rounded-t-lg border border-border/60 border-b-0 bg-muted/40 pb-3">
        <div className="flex h-9 min-w-0 items-center gap-2 ps-3 pe-1">
          {filename ? (
            <p className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
              {filename}
            </p>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {headerEnd}
        </div>
      </div>
      <div className="-mt-3 relative min-w-0 rounded-lg border border-border/60 bg-background">
        <div className="absolute end-1 top-1 z-10">
          <CopyCodeButton code={code} label="snippet" />
        </div>
        <pre
          className="scrollbar-floating m-0 overflow-x-auto p-3 pe-10 font-mono text-xs leading-relaxed"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high escapes the source before tokenizing
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </div>
    </div>
  );
}
