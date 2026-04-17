"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TwitterPostPreview } from "@notra/ui/components/ai-elements/twitter-post-preview";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

type PreviewState = "draft" | "loading" | "finished";

interface TwitterPreviewAuthor {
  name: string;
  avatar?: string;
}

interface TwitterPreviewProps {
  state: PreviewState;
  title: string;
  markdown: string;
  author?: TwitterPreviewAuthor;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function TwitterPreview({
  state: incomingState,
  title,
  markdown,
  author,
  onApprove,
  onDeny,
}: TwitterPreviewProps) {
  const [optimisticState, setOptimisticState] = useState<PreviewState | null>(
    null
  );

  useEffect(() => {
    if (incomingState === "finished") {
      setOptimisticState(null);
    }
  }, [incomingState]);

  const state = optimisticState ?? incomingState;

  const [isOpen, setIsOpen] = useState(state !== "finished");

  useEffect(() => {
    setIsOpen(state !== "finished");
  }, [state]);

  const handleApprove = useCallback(() => {
    setOptimisticState("loading");
    onApprove?.();
  }, [onApprove]);

  const handleDeny = useCallback(() => {
    onDeny?.();
  }, [onDeny]);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className="ml-px max-w-md">
        <div className="rounded-lg border border-border bg-muted/80">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 [&[data-panel-open]>svg]:rotate-90">
            <HugeiconsIcon
              className="size-4 shrink-0 text-muted-foreground transition-transform"
              icon={ArrowRight01Icon}
            />
            <span className="min-w-0 truncate text-left font-medium text-sm">
              {title}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {state === "finished" && (
                <Badge className="text-[0.625rem]" variant="outline">
                  draft
                </Badge>
              )}
              <Badge
                className="flex items-center gap-1 text-[0.625rem] capitalize"
                variant="secondary"
              >
                <OutputTypeIcon className="size-3" outputType="twitter_post" />
                {getOutputTypeLabel("twitter_post")}
              </Badge>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mx-2 mb-2">
              <TwitterPostPreview
                author={{
                  name: author?.name ?? "Your Name",
                  avatar: author?.avatar,
                  handle: (author?.name ?? "yourname")
                    .toLowerCase()
                    .replace(/\s+/g, ""),
                }}
                className="w-full"
                content={markdown}
                timestamp="Just now"
              />
            </div>
          </CollapsibleContent>

          {state !== "finished" && (
            <div className="flex items-center justify-end gap-2 px-3 pb-2">
              {state === "draft" && (
                <Button onClick={handleDeny} size="sm" variant="ghost">
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  Discard
                </Button>
              )}
              <Button
                disabled={state === "loading"}
                onClick={handleApprove}
                size="sm"
              >
                {state === "loading" ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      className="size-4"
                      icon={CheckmarkSquare01Icon}
                    />
                    Save as draft
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Collapsible>
  );
}
