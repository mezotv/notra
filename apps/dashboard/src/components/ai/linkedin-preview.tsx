"use client";

import {
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CHAT_PREVIEW_SAVE_TIMEOUT_MS } from "@notra/ai/constants/chat";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useReducer } from "react";
import { toast } from "sonner";
import { BrailleLoader } from "@/components/braille-loader";
import { Button } from "@/components/button";
import { LinkedInPost } from "@/components/linkedin-post";
import { LINKEDIN_BRAND_PRIMARY } from "@/constants/linkedin";
import type {
  PreviewEffectiveState,
  PreviewIncomingState,
} from "@/types/content/ai-preview";
import {
  copyLinkedInPostForPublishing,
  createLinkedInPostUrl,
} from "@/utils/linkedin";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";
import { socialPreviewReducer } from "@/utils/social-preview-reducer";

interface LinkedInPreviewProps {
  state: PreviewIncomingState;
  title: string;
  markdown: string;
  organization?: {
    name: string;
    logo?: string | null;
  };
  persistedStatus?: "draft" | "published";
  onApprove?: () => void;
  onDeny?: () => void;
  onPersist?: (
    status: "draft" | "published",
    payload: { title: string; markdown: string }
  ) => Promise<void>;
  onRegenerate?: (
    instructions: string,
    payload: { title: string; markdown: string }
  ) => void;
}

export function LinkedInPreview({
  state: incomingState,
  title,
  markdown,
  organization,
  persistedStatus = "draft",
  onApprove,
  onDeny,
  onPersist,
  onRegenerate,
}: LinkedInPreviewProps) {
  const [
    {
      userAction,
      draftMarkdown,
      regenerateOpen,
      regenerateInstructions,
      isOpen,
    },
    dispatch,
  ] = useReducer(socialPreviewReducer, {
    userAction: "none",
    draftMarkdown: markdown,
    regenerateOpen: false,
    regenerateInstructions: "",
    isOpen: incomingState !== "finished",
  });

  useEffect(() => {
    dispatch({ type: "draftMarkdownChanged", draftMarkdown: markdown });
  }, [markdown]);

  const effectiveState: PreviewEffectiveState = (() => {
    if (incomingState === "finished") {
      return "finished";
    }
    if (userAction === "saving" || userAction === "generating") {
      return "loading";
    }
    if (userAction === "save-failed") {
      return "finished";
    }
    return "draft";
  })();

  useEffect(() => {
    if (userAction !== "saving" && userAction !== "generating") {
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "userActionChanged", userAction: "save-failed" });
    }, CHAT_PREVIEW_SAVE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [userAction]);

  const handleApprove = useCallback(async () => {
    dispatch({ type: "userActionChanged", userAction: "saving" });
    dispatch({ type: "openChanged", open: false });
    const toastId = toast.loading("Saving draft...");
    try {
      if (onPersist) {
        await onPersist("draft", {
          title,
          markdown: draftMarkdown,
        });
      } else {
        onApprove?.();
      }
      dispatch({ type: "userActionChanged", userAction: "none" });
      toast.success("Saved as draft", { id: toastId });
    } catch {
      dispatch({ type: "userActionChanged", userAction: "save-failed" });
      toast.error("Failed to save draft", { id: toastId });
    }
  }, [draftMarkdown, onApprove, onPersist, title]);

  const handleDeny = useCallback(() => {
    onDeny?.();
    toast("Canceled");
  }, [onDeny]);

  const handleRegenerate = useCallback(() => {
    const instructions = regenerateInstructions.trim();
    if (!instructions) {
      dispatch({ type: "regenerateOpenChanged", open: true });
      return;
    }
    dispatch({ type: "userActionChanged", userAction: "generating" });
    toast("Generating post...");
    onRegenerate?.(instructions, {
      title,
      markdown: draftMarkdown,
    });
  }, [draftMarkdown, onRegenerate, regenerateInstructions, title]);

  const handlePostToLinkedIn = useCallback(() => {
    copyLinkedInPostForPublishing(draftMarkdown);
  }, [draftMarkdown]);

  const isFinished = effectiveState === "finished";
  const showStatusBadge = isFinished && userAction !== "save-failed";

  return (
    <Collapsible
      onOpenChange={(open) => dispatch({ type: "openChanged", open })}
      open={isOpen}
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
              {showStatusBadge && (
                <Badge className="text-[0.625rem]" variant="outline">
                  {persistedStatus}
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
            <div className="mx-2 mb-2 space-y-2">
              <div className="flex justify-center py-4">
                <LinkedInPost
                  author={{
                    name: organization?.name ?? "Your Name",
                    avatar: organization?.logo ?? undefined,
                  }}
                  className="w-full max-w-lg"
                  content={draftMarkdown}
                  defaultExpanded
                  onContentChange={
                    isFinished
                      ? undefined
                      : (value) =>
                          dispatch({
                            type: "draftMarkdownChanged",
                            draftMarkdown: value,
                          })
                  }
                  timestamp="Just now"
                  truncate={false}
                />
              </div>
              {regenerateOpen && !isFinished && (
                <input
                  autoFocus
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    dispatch({
                      type: "regenerateInstructionsChanged",
                      instructions: event.target.value,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleRegenerate();
                    }
                  }}
                  placeholder="What should change?"
                  value={regenerateInstructions}
                />
              )}
            </div>
          </CollapsibleContent>

          {!isFinished && isOpen && (
            <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
              {userAction === "generating" && (
                <div className="mr-auto flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                  <BrailleLoader className="text-xs" label="Generating post" />
                </div>
              )}
              {effectiveState === "draft" && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label="Regenerate"
                          onClick={() =>
                            dispatch({ type: "regenerateOpenToggled" })
                          }
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <HugeiconsIcon
                        className="size-4"
                        icon={ArrowReloadHorizontalIcon}
                      />
                    </TooltipTrigger>
                    <TooltipContent>Regenerate</TooltipContent>
                  </Tooltip>
                  <Button onClick={handleDeny} size="sm" variant="ghost">
                    <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                    Discard
                  </Button>
                </div>
              )}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <Button
                  disabled={effectiveState === "loading"}
                  onClick={handleApprove}
                  size="sm"
                  variant="outline"
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
                <Button
                  className="max-w-full text-white hover:opacity-90"
                  nativeButton={false}
                  render={
                    <a
                      href={createLinkedInPostUrl(draftMarkdown)}
                      onClick={handlePostToLinkedIn}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Linkedin className="size-4" />
                      Post to LinkedIn
                    </a>
                  }
                  size="sm"
                  style={{ backgroundColor: LINKEDIN_BRAND_PRIMARY }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Collapsible>
  );
}
