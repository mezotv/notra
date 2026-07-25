"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/button";
import { LinkedInPost } from "@/components/linkedin-post";
import { TwitterPost } from "@/components/twitter-post";
import { LINKEDIN_BRAND_PRIMARY } from "@/constants/linkedin";
import { CONFETTI_COLORS } from "@/constants/post-social";
import { SOCIAL_PLATFORM_LABELS } from "@/constants/social-connect";
import { TWITTER_BRAND_COLOR } from "@/constants/twitter";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useCreateReferenceForVoice } from "@/lib/hooks/use-brand-references";
import { usePublishSocialPost } from "@/lib/hooks/use-connected-accounts";
import { useSelectedSocialAccount } from "@/lib/hooks/use-selected-social-account";
import { cn } from "@/lib/utils";
import type { PostSocialButtonProps } from "@/types/content/post-social";
import {
  copyLinkedInPostForPublishing,
  createLinkedInPostUrl,
  linkedInAuthorFromAccount,
} from "@/utils/linkedin";
import {
  buildReferenceInput,
  getPublishErrorInfo,
} from "@/utils/social-publish";
import {
  createTwitterPostUrl,
  getTwitterCharLimit,
  twitterAuthorFromAccount,
} from "@/utils/twitter";

export function PostSocialButton({
  platform,
  organizationId,
  content,
  className,
  onPublished,
}: PostSocialButtonProps) {
  const params = useParams<{ slug?: string }>();
  const { accounts, selectedAccount, selectAccount } = useSelectedSocialAccount(
    organizationId,
    platform
  );
  const publishMutation = usePublishSocialPost(organizationId, platform);
  const { data: brandSettings } = useBrandSettings(organizationId);
  const voices = brandSettings?.voices ?? [];
  const createReference = useCreateReferenceForVoice(organizationId);
  const [referencedVoiceIds, setReferencedVoiceIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  const label = SOCIAL_PLATFORM_LABELS[platform];
  const brandColor =
    platform === "twitter" ? TWITTER_BRAND_COLOR : LINKEDIN_BRAND_PRIMARY;
  const BrandIcon = platform === "twitter" ? XTwitter : Linkedin;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      publishMutation.reset();
      setReferencedVoiceIds([]);
      setDraft(content);
      setIsEditing(false);
    }
  };

  const handlePublish = () => {
    if (!(selectedAccount && draft.trim()) || isOverCharLimit) {
      return;
    }
    setIsEditing(false);
    publishMutation.mutate(
      { accountId: selectedAccount.id, content: draft },
      {
        onSuccess: (result) => {
          onPublished?.({
            platform,
            postUrl: result.postUrl,
            username: result.username,
            content: draft,
          });
        },
      }
    );
  };

  const published = publishMutation.isSuccess ? publishMutation.data : null;

  const handleAddReference = (voiceId: string, voiceName: string) => {
    if (!(published && selectedAccount)) {
      return;
    }
    createReference.mutate(
      {
        voiceId,
        data: buildReferenceInput(
          platform,
          draft,
          published.postUrl,
          published.platformPostId,
          published.username,
          selectedAccount
        ),
      },
      {
        onSuccess: () => {
          setReferencedVoiceIds((ids) => [...ids, voiceId]);
          toast.success(`Added as reference to ${voiceName}`);
        },
        onError: () => {
          toast.error("Failed to add reference");
        },
      }
    );
  };

  const handleMissingVoice = () => {
    toast.error(
      "No brand identity to save this reference to. Create one on the Brand Identity page first."
    );
  };

  const publishError = getPublishErrorInfo(publishMutation.error, platform);

  const charLimit =
    platform === "twitter" && selectedAccount
      ? getTwitterCharLimit(selectedAccount.verifiedType)
      : null;
  const overCharCount = charLimit ? Math.max(0, draft.length - charLimit) : 0;
  const isOverCharLimit = overCharCount > 0;

  if (!selectedAccount) {
    return (
      <Button
        className={cn("text-white hover:opacity-90", className)}
        nativeButton={false}
        render={
          platform === "twitter" ? (
            <a
              href={createTwitterPostUrl(content)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <BrandIcon className="size-4" />
              Post to {label}
            </a>
          ) : (
            <a
              href={createLinkedInPostUrl(content)}
              onClick={() => copyLinkedInPostForPublishing(content)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <BrandIcon className="size-4" />
              Post to {label}
            </a>
          )
        }
        size="sm"
        style={{ backgroundColor: brandColor }}
      />
    );
  }

  const accountSelector = published
    ? undefined
    : { accounts, onSelect: selectAccount };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogTrigger
        className={cn(
          buttonVariants({ size: "sm" }),
          "text-white hover:opacity-90",
          className
        )}
        style={{ backgroundColor: brandColor }}
      >
        <BrandIcon className="size-4" />
        Post to {label}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-lg">
        {published && (
          <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
            <Confetti
              colors={CONFETTI_COLORS}
              duration={3000}
              force={0.5}
              particleCount={120}
              particleShape="mix"
              particleSize={8}
              stageHeight={600}
              stageWidth={800}
            />
          </div>
        )}
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Post to {label}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {publishMutation.isError && (
          <div className="space-y-1">
            <p className="text-destructive text-sm">{publishError.message}</p>
            {publishError.docsUrl && (
              <p className="text-muted-foreground text-sm">
                {label} rejects duplicate posts.{" "}
                <a
                  className="text-primary underline underline-offset-2"
                  href={publishError.docsUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read the {label} docs
                </a>
              </p>
            )}
            {publishError.reconnectRequired && params.slug && (
              <p className="text-muted-foreground text-sm">
                Have you tried reconnecting?{" "}
                <Link
                  className="text-primary underline underline-offset-2"
                  href={`/${params.slug}/settings/general`}
                >
                  Reconnect in settings
                </Link>
              </p>
            )}
          </div>
        )}
        {platform === "twitter" ? (
          <TwitterPost
            accountSelector={accountSelector}
            author={twitterAuthorFromAccount(selectedAccount)}
            content={draft}
            onContentChange={isEditing && !published ? setDraft : undefined}
            timestamp="Just now"
          />
        ) : (
          <LinkedInPost
            accountSelector={accountSelector}
            author={linkedInAuthorFromAccount(selectedAccount)}
            content={draft}
            defaultExpanded
            onContentChange={isEditing && !published ? setDraft : undefined}
            timestamp="Just now"
            truncate={false}
          />
        )}
        {!published && charLimit !== null && isOverCharLimit && (
          <p className="text-amber-600 text-sm dark:text-amber-500">
            This post is {overCharCount.toLocaleString()}{" "}
            {overCharCount === 1 ? "character" : "characters"} over the{" "}
            {charLimit.toLocaleString()} character limit for @
            {selectedAccount.username}. Shorten it to post.
          </p>
        )}
        <ResponsiveDialogFooter>
          {published ? (
            <>
              {voices.length === 0 && (
                <Button onClick={handleMissingVoice} variant="outline">
                  Add as reference
                </Button>
              )}
              {voices.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(buttonVariants({ variant: "outline" }))}
                    disabled={createReference.isPending}
                  >
                    {createReference.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : null}
                    Add as reference
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {voices.map((voice) => {
                      const alreadyAdded = referencedVoiceIds.includes(
                        voice.id
                      );
                      return (
                        <DropdownMenuItem
                          disabled={alreadyAdded}
                          key={voice.id}
                          onClick={() =>
                            handleAddReference(voice.id, voice.name)
                          }
                        >
                          {voice.name}
                          {voice.isDefault && (
                            <span className="text-muted-foreground text-xs">
                              Default
                            </span>
                          )}
                          {alreadyAdded && (
                            <HugeiconsIcon
                              className="ml-auto size-4"
                              icon={Tick02Icon}
                            />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {published.postUrl && (
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={published.postUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <BrandIcon className="size-4" />
                      Open on {label}
                    </a>
                  }
                  variant="outline"
                />
              )}
              <ResponsiveDialogClose render={<Button>Done</Button>} />
            </>
          ) : (
            <>
              <Button
                className="mr-auto"
                onClick={() => setIsEditing((editing) => !editing)}
                variant="outline"
              >
                {isEditing ? "Preview" : "Edit post"}
              </Button>
              <ResponsiveDialogClose
                render={<Button variant="outline">Cancel</Button>}
              />
              <Button
                disabled={
                  publishMutation.isPending || !draft.trim() || isOverCharLimit
                }
                onClick={handlePublish}
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  `Post as @${selectedAccount.username}`
                )}
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
