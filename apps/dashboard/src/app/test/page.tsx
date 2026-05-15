"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

const PREVIEW_SCALE = 0.5;
const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const EXPORT_NAME = "C15t Twitter Post";

export default function FigmaCopyTestPage() {
  const designRef = useRef<HTMLDivElement>(null);

  const { data: html, isPending: isLoading } = useQuery({
    queryKey: ["test-index-copy-html"],
    queryFn: async () => {
      const res = await fetch("/index-copy.html");
      if (!res.ok) {
        throw new Error(`Failed to load HTML: ${res.status}`);
      }
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      return doc.body.innerHTML;
    },
  });

  const copyFigmaMutation = useMutation({
    mutationFn: async () => {
      const el = designRef.current;
      if (!el) {
        throw new Error("Design not ready");
      }
      const { buildFigmaPasteHtml } = await import("@notra/kiwi");
      const html = await buildFigmaPasteHtml(el, {
        name: EXPORT_NAME,
      });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    },
    onSuccess: () => toast.success("Copied. Now paste into Figma (Cmd+V)"),
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Copy failed: ${message}`);
    },
  });

  const copyPaperMutation = useMutation({
    mutationFn: async () => {
      const el = designRef.current;
      if (!el) {
        throw new Error("Design not ready");
      }
      const { copyAsPaper } = await import("@notra/kiwi");
      await copyAsPaper(el, { name: EXPORT_NAME });
    },
    onSuccess: () => toast.success("Copied. Now paste into Paper (Cmd+V)"),
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Copy failed: ${message}`);
    },
  });

  const isCopying = copyFigmaMutation.isPending || copyPaperMutation.isPending;

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background p-8 text-foreground">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-semibold text-2xl text-foreground">
          Clipboard export test
        </h1>
        <p className="text-muted-foreground text-sm">
          Loads <code>public/index-copy.html</code>. Copy it for Figma or Paper,
          then paste (Cmd+V).
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            disabled={isLoading || isCopying || !html}
            onClick={() => copyFigmaMutation.mutate()}
          >
            {copyFigmaMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
            )}
            Copy as Figma
          </Button>
          <Button
            className="hover:opacity-90"
            disabled={isLoading || isCopying || !html}
            onClick={() => copyPaperMutation.mutate()}
            style={{ backgroundColor: "#81ACEC", color: "#ffffff" }}
          >
            {copyPaperMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
            )}
            Copy to Paper
          </Button>
        </div>
      </div>

      {isLoading || !html ? (
        <Skeleton className="h-[19.6875rem] w-[37.5rem] max-w-full" />
      ) : (
        <>
          <div
            className="relative max-w-full overflow-hidden rounded-lg border bg-muted/20 shadow-sm"
            style={{
              height: PREVIEW_HEIGHT * PREVIEW_SCALE,
              width: PREVIEW_WIDTH * PREVIEW_SCALE,
            }}
          >
            <div
              className="origin-top-left"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: test page renders local static HTML
              dangerouslySetInnerHTML={{ __html: html }}
              style={{ transform: `scale(${PREVIEW_SCALE})` }}
            />
          </div>
          <div
            aria-hidden="true"
            className="-left-[10000px] pointer-events-none fixed top-0 opacity-0"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: hidden unscaled copy source for Figma export
            dangerouslySetInnerHTML={{ __html: html }}
            ref={designRef}
          />
        </>
      )}
    </div>
  );
}
