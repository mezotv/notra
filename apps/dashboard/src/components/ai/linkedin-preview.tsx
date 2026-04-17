"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkedInPostPreview } from "@notra/ui/components/ai-elements/linkedin-post-preview";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CHAT_LINKEDIN_PREVIEW_TRUNCATION_LIMIT,
  CHAT_PREVIEW_SAVE_TIMEOUT_MS,
} from "@/constants/chat";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

type IncomingState = "draft" | "finished";
type EffectiveState = "draft" | "loading" | "finished";
type UserAction = "none" | "saving" | "save-failed";

interface LinkedInPreviewAuthor {
  name: string;
  avatar?: string;
}

interface LinkedInPreviewProps {
  state: IncomingState;
  title: string;
  markdown: string;
  author?: LinkedInPreviewAuthor;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function LinkedInPreview({
  state: incomingState,
  title,
  markdown,
  author,
  onApprove,
  onDeny,
}: LinkedInPreviewProps) {
  const [userAction, setUserAction] = useState<UserAction>("none");

  const effectiveState: EffectiveState = (() => {
    if (incomingState === "finished") {
      return "finished";
    }
    if (userAction === "saving") {
      return "loading";
    }
    if (userAction === "save-failed") {
      return "finished";
    }
    return "draft";
  })();

  useEffect(() => {
    if (userAction !== "saving") {
      return;
    }
    const timer = window.setTimeout(() => {
      setUserAction("save-failed");
    }, CHAT_PREVIEW_SAVE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [userAction]);

  const handleApprove = useCallback(() => {
    setUserAction("saving");
    onApprove?.();
  }, [onApprove]);

  const handleDeny = useCallback(() => {
    onDeny?.();
  }, [onDeny]);

  const isFinished = effectiveState === "finished";
  const showDraftBadge = isFinished && userAction !== "save-failed";

  return (
    <Collapsible
      defaultOpen={!isFinished}
      key={isFinished ? "collapsed" : "open"}
    >
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
              {showDraftBadge && (
                <Badge className="text-[0.625rem]" variant="outline">
                  draft
                </Badge>
              )}
              <Badge
                className="flex items-center gap-1 text-[0.625rem] capitalize"
                variant="secondary"
              >
                <OutputTypeIcon className="size-3" outputType="linkedin_post" />
                {getOutputTypeLabel("linkedin_post")}
              </Badge>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mx-2 mb-2">
              <LinkedInPostPreview
                author={{
                  name: author?.name ?? "Your Name",
                  avatar: author?.avatar,
                }}
                className="w-full"
                content={markdown}
                timestamp="Just now"
                truncationLimit={CHAT_LINKEDIN_PREVIEW_TRUNCATION_LIMIT}
              />
            </div>
          </CollapsibleContent>

          {!isFinished && (
            <div className="flex items-center justify-end gap-2 px-3 pb-2">
              {effectiveState === "draft" && (
                <Button onClick={handleDeny} size="sm" variant="ghost">
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  Discard
                </Button>
              )}
              <Button
                disabled={effectiveState === "loading"}
                onClick={handleApprove}
                size="sm"
              >
                {effectiveState === "loading" ? (
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
