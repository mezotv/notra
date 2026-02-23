"use client";

import {
  Cancel01Icon,
  Clapping02Icon,
  Comment01Icon,
  FavouriteIcon,
  GlobalIcon,
  MoreHorizontalIcon,
  RepostIcon,
  SentIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Card } from "@notra/ui/components/ui/card";
import { Separator } from "@notra/ui/components/ui/separator";
import { Textarea } from "@notra/ui/components/ui/textarea";
import Image from "next/image";
import type * as React from "react";
import { useState } from "react";
import { LINKEDIN_TRUNCATION_LIMIT } from "@/constants/linkedin";
import { cn } from "@/lib/utils";

interface LinkedInPostProps extends React.ComponentProps<"div"> {
  author: {
    name: string;
    avatar?: string;
    fallback?: string;
    headline?: string;
  };
  content?: string;
  onContentChange?: (value: string) => void;
  image?: { src: string; alt: string };
  reactions?: { count: number; types?: Array<"like" | "love" | "celebrate"> };
  comments?: number;
  reposts?: number;
  timestamp?: string;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onSend?: () => void;
  onClose?: () => void;
  truncate?: boolean;
  truncationLimit?: number;
  defaultExpanded?: boolean;
}

const reactionColors: Record<string, string> = {
  like: "#378FE9",
  love: "#DF704D",
  celebrate: "#D0A819",
};

const reactionIcons: Record<string, typeof ThumbsUpIcon> = {
  like: ThumbsUpIcon,
  love: FavouriteIcon,
  celebrate: Clapping02Icon,
};

function ReactionDot({ type }: { type: string }) {
  return (
    <span
      className="flex size-4 items-center justify-center rounded-full text-white ring-1 ring-background"
      style={{ backgroundColor: reactionColors[type] ?? reactionColors.like }}
    >
      <HugeiconsIcon
        className="size-2.5"
        icon={reactionIcons[type] ?? ThumbsUpIcon}
      />
    </span>
  );
}

function PostContent({
  content,
  truncate,
  truncationLimit = LINKEDIN_TRUNCATION_LIMIT,
  defaultExpanded = true,
}: {
  content: string;
  truncate?: boolean;
  truncationLimit?: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const canTruncate = truncate && content.length > truncationLimit;
  const isCollapsed = canTruncate && !expanded;
  const displayContent = isCollapsed
    ? content.slice(0, truncationLimit).trimEnd()
    : content;

  return (
    <div className="text-sm">
      <span className="whitespace-pre-wrap">{displayContent}</span>
      {isCollapsed && (
        <button
          className="ml-2 cursor-pointer font-medium text-muted-foreground hover:text-foreground hover:underline"
          onClick={() => setExpanded(true)}
          type="button"
        >
          …more
        </button>
      )}
    </div>
  );
}

function LinkedInPost({
  author,
  content,
  onContentChange,
  image,
  reactions,
  comments,
  reposts,
  timestamp,
  onLike,
  onComment,
  onRepost,
  onSend,
  onClose,
  truncate,
  truncationLimit,
  defaultExpanded,
  className,
  ...props
}: LinkedInPostProps) {
  const reactionTypes = reactions?.types ?? ["like"];
  const hasEngagement =
    (reactions?.count ?? 0) > 0 || (comments ?? 0) > 0 || (reposts ?? 0) > 0;
  const isEditable = Boolean(onContentChange);

  return (
    <Card className={cn("grid h-fit gap-0 py-0", className)} {...props}>
      <div className="flex items-start gap-2 px-4 pt-3 pb-1">
        <Avatar className="size-12" size="lg">
          {author.avatar && <AvatarImage src={author.avatar} />}
          <AvatarFallback>
            {author.fallback ?? author.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">{author.name}</p>
          {author.headline && (
            <p className="truncate text-muted-foreground text-xs leading-tight">
              {author.headline}
            </p>
          )}
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            {timestamp && <span>{timestamp}</span>}
            {timestamp && <span>·</span>}
            <HugeiconsIcon className="size-3" icon={GlobalIcon} />
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            className="text-muted-foreground"
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-5" icon={MoreHorizontalIcon} />
          </Button>
          <Button
            className="text-muted-foreground"
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-5" icon={Cancel01Icon} />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-2">
        {isEditable ? (
          <Textarea
            className="min-h-[6.5rem] resize-none rounded-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            defaultValue={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            placeholder="What do you want to talk about?"
          />
        ) : content ? (
          <PostContent
            content={content}
            defaultExpanded={defaultExpanded}
            truncate={truncate}
            truncationLimit={truncationLimit}
          />
        ) : null}
      </div>

      {image && (
        <div className="bg-muted">
          <Image
            alt={image.alt}
            className="w-full object-cover"
            height={100}
            src={image.src}
            width={100}
          />
        </div>
      )}

      {hasEngagement && (
        <div className="flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-1">
            {reactions?.count && reactions.count > 0 && (
              <>
                <div className="-space-x-0.5 flex">
                  {reactionTypes.map((type) => (
                    <ReactionDot key={type} type={type} />
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">
                  {reactions.count.toLocaleString()}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {(comments ?? 0) > 0 && (
              <span>{comments?.toLocaleString()} comments</span>
            )}
            {(reposts ?? 0) > 0 && (
              <span>{reposts?.toLocaleString()} reposts</span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-2 py-2">
        <Separator className="mx-4" />

        <div className="flex items-center justify-around px-2">
          <Button
            className="flex-1 gap-1.5 text-muted-foreground"
            onClick={onLike}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={ThumbsUpIcon} />
            <span className="text-xs">Like</span>
          </Button>
          <Button
            className="flex-1 gap-1.5 text-muted-foreground"
            onClick={onComment}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={Comment01Icon} />
            <span className="text-xs">Comment</span>
          </Button>
          <Button
            className="flex-1 gap-1.5 text-muted-foreground"
            onClick={onRepost}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={RepostIcon} />
            <span className="text-xs">Repost</span>
          </Button>
          <Button
            className="flex-1 gap-1.5 text-muted-foreground"
            onClick={onSend}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={SentIcon} />
            <span className="text-xs">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export { LinkedInPost, type LinkedInPostProps, LINKEDIN_TRUNCATION_LIMIT };
