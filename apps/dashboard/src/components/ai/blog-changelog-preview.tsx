"use client";

import {
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CHAT_PREVIEW_SAVE_TIMEOUT_MS } from "@notra/ai/constants/chat";
import type { ContentType } from "@notra/ai/schemas/content";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LexicalEditor } from "@/components/content/editor/lexical-editor";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

type IncomingState = "draft" | "finished";
type EffectiveState = "draft" | "loading" | "finished";
type UserAction =
  | "none"
  | "saving"
  | "publishing"
  | "generating"
  | "save-failed";

interface BlogChangelogPreviewProps {
  state: IncomingState;
  title: string;
  markdown: string;
  contentType: Extract<
    ContentType,
    "blog_post" | "changelog" | "investor_update"
  >;
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

export function BlogChangelogPreview({
  state: incomingState,
  title,
  markdown,
  contentType,
  persistedStatus = "draft",
  onApprove,
  onDeny,
  onPersist,
  onRegenerate,
}: BlogChangelogPreviewProps) {
  const [userAction, setUserAction] = useState<UserAction>("none");
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftMarkdown, setDraftMarkdown] = useState(markdown);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");
  const [isOpen, setIsOpen] = useState(incomingState !== "finished");

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    setDraftMarkdown(markdown);
  }, [markdown]);

  const effectiveState: EffectiveState = (() => {
    if (incomingState === "finished") {
      return "finished";
    }
    if (
      userAction === "saving" ||
      userAction === "publishing" ||
      userAction === "generating"
    ) {
      return "loading";
    }
    if (userAction === "save-failed") {
      return "finished";
    }
    return "draft";
  })();

  useEffect(() => {
    if (
      userAction !== "saving" &&
      userAction !== "publishing" &&
      userAction !== "generating"
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setUserAction("save-failed");
    }, CHAT_PREVIEW_SAVE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [userAction]);

  const handleApprove = useCallback(async () => {
    setUserAction("saving");
    setIsOpen(false);
    const toastId = toast.loading("Saving draft...");
    try {
      if (onPersist) {
        await onPersist("draft", {
          title: draftTitle,
          markdown: draftMarkdown,
        });
      } else {
        onApprove?.();
      }
      setUserAction("none");
      toast.success("Saved as draft", { id: toastId });
    } catch {
      setUserAction("save-failed");
      toast.error("Failed to save draft", { id: toastId });
    }
  }, [draftMarkdown, draftTitle, onApprove, onPersist]);

  const handlePublish = useCallback(async () => {
    setUserAction("publishing");
    setIsOpen(false);
    const toastId = toast.loading("Publishing post...");
    try {
      if (!onPersist) {
        setUserAction("save-failed");
        toast.error("Publish is not available", { id: toastId });
        return;
      }
      await onPersist("published", {
        title: draftTitle,
        markdown: draftMarkdown,
      });
      setUserAction("none");
      toast.success("Post published", { id: toastId });
    } catch {
      setUserAction("save-failed");
      toast.error("Failed to publish post", { id: toastId });
    }
  }, [draftMarkdown, draftTitle, onPersist]);

  const handleDeny = useCallback(() => {
    onDeny?.();
    toast("Canceled");
  }, [onDeny]);

  const handleRegenerate = useCallback(() => {
    const instructions = regenerateInstructions.trim();
    if (!instructions) {
      setRegenerateOpen(true);
      return;
    }
    setUserAction("generating");
    toast("Generating post...");
    onRegenerate?.(instructions, {
      title: draftTitle,
      markdown: draftMarkdown,
    });
  }, [draftMarkdown, draftTitle, onRegenerate, regenerateInstructions]);

  const isFinished = effectiveState === "finished";
  const showStatusBadge = isFinished && userAction !== "save-failed";

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className="ml-px max-w-xl">
        <div className="rounded-lg border border-border bg-muted/80">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 [&[data-panel-open]>svg]:rotate-90">
            <HugeiconsIcon
              className="size-4 shrink-0 text-muted-foreground transition-transform"
              icon={ArrowRight01Icon}
            />
            <span className="min-w-0 truncate text-left font-medium text-sm">
              {draftTitle}
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
                <OutputTypeIcon className="size-3" outputType={contentType} />
                {getOutputTypeLabel(contentType)}
              </Badge>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mx-2 mb-2 space-y-2">
              {!isFinished && (
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setDraftTitle(event.target.value)}
                  value={draftTitle}
                />
              )}
              <Tabs defaultValue="markdown">
                <TabsList variant="line">
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent className="mt-2" value="markdown">
                  <textarea
                    className="min-h-72 w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setDraftMarkdown(event.target.value)}
                    readOnly={isFinished}
                    value={draftMarkdown}
                  />
                </TabsContent>
                <TabsContent className="mt-2" value="preview">
                  <div className="max-h-[24rem] overflow-y-auto rounded-lg border border-border/80 bg-background px-4 py-3">
                    <LexicalEditor
                      editable={!isFinished}
                      initialMarkdown={draftMarkdown}
                      onChange={setDraftMarkdown}
                      onSelectionChange={() => null}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              {regenerateOpen && !isFinished && (
                <input
                  autoFocus
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    setRegenerateInstructions(event.target.value)
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
                  <Loader2Icon className="size-4 animate-spin" />
                  <span className="truncate">Generating post...</span>
                </div>
              )}
              {effectiveState === "draft" && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label="Regenerate"
                          onClick={() => setRegenerateOpen((open) => !open)}
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
                  disabled={effectiveState === "loading"}
                  onClick={handlePublish}
                  size="sm"
                >
                  {effectiveState === "loading" &&
                  userAction === "publishing" ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Publishing
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Collapsible>
  );
}
