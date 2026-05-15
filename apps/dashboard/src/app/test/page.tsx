"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

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

  const copyMutation = useMutation({
    mutationFn: async () => {
      const el = designRef.current;
      if (!el) {
        throw new Error("Design not ready");
      }
      const { buildFigmaPasteHtml } = await import("@notra/kiwi");
      const html = await buildFigmaPasteHtml(el, {
        name: "C15t Twitter Post",
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

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background p-8 text-foreground">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-semibold text-2xl text-foreground">
          Figma clipboard test
        </h1>
        <p className="text-muted-foreground text-sm">
          Loads <code>public/index-copy.html</code>. Click "Copy as Figma", then
          paste (Cmd+V) into Figma.
        </p>
        <Button
          className="mt-4"
          disabled={isLoading || copyMutation.isPending || !html}
          onClick={() => copyMutation.mutate()}
        >
          {copyMutation.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-4" icon={Copy01Icon} />
          )}
          Copy as Figma
        </Button>
      </div>

      {isLoading || !html ? (
        <Skeleton className="h-[39.375rem] w-[75rem]" />
      ) : (
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: test page renders local static HTML
          dangerouslySetInnerHTML={{ __html: html }}
          ref={designRef}
        />
      )}
    </div>
  );
}
