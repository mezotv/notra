"use client";

import {
  Bookmark02Icon,
  Comment01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Card } from "@notra/ui/components/ui/card";
import { XVerifiedBadge } from "@notra/ui/components/ui/svgs/twitter";
import { Textarea } from "@notra/ui/components/ui/textarea";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import type { TextSelection } from "@/components/chat-input";
import { TWITTER_CHAR_LIMIT } from "@/constants/twitter";
import { cn } from "@/lib/utils";

interface TwitterPostProps extends React.ComponentProps<"div"> {
  author: {
    name: string;
    avatar?: string;
    fallback?: string;
    handle?: string;
  };
  content?: string;
  onContentChange?: (value: string) => void;
  onSelectionChange?: (selection: TextSelection | null) => void;
  timestamp?: string;
}

function TweetContent({
  content,
  onSelectionChange,
}: {
  content: string;
  onSelectionChange?: (selection: TextSelection | null) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const container = contentRef.current;
      if (!selection || !container) {
        return;
      }

      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      if (!anchorNode || !focusNode) {
        return;
      }

      if (!container.contains(anchorNode) || !container.contains(focusNode)) {
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        return;
      }

      const startIndex = content.indexOf(selectedText);
      if (startIndex === -1) {
        return;
      }

      const beforeText = content.substring(0, startIndex);
      const lines = beforeText.split("\n");
      const startLine = lines.length;
      const startChar = (lines.at(-1)?.length ?? 0) + 1;

      const selectedLines = selectedText.split("\n");
      const endLine = startLine + selectedLines.length - 1;
      const endChar =
        selectedLines.length === 1
          ? startChar + selectedText.length
          : (selectedLines.at(-1)?.length ?? 0) + 1;

      onSelectionChange({
        text: selectedText,
        startLine,
        startChar,
        endLine,
        endChar,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [content, onSelectionChange]);

  return (
    <div className="text-[0.9375rem] leading-snug" ref={contentRef}>
      <span className="whitespace-pre-wrap">{content}</span>
    </div>
  );
}

function CharacterCounter({ count }: { count: number }) {
  const remaining = TWITTER_CHAR_LIMIT - count;
  const isOver = remaining < 0;
  const isWarning = remaining <= 20 && remaining >= 0;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        isOver && "font-medium text-destructive",
        isWarning && "text-amber-500",
        !isOver && !isWarning && "text-muted-foreground"
      )}
    >
      {remaining}
    </span>
  );
}

function TwitterPost({
  author,
  content,
  onContentChange,
  onSelectionChange,
  timestamp,
  className,
  ...props
}: TwitterPostProps) {
  const isEditable = Boolean(onContentChange);
  const [localValue, setLocalValue] = useState(() => content ?? "");

  if ((content ?? "") !== localValue) {
    setLocalValue(content ?? "");
  }

  return (
    <Card className={cn("grid h-fit gap-0 py-0", className)} {...props}>
      <div className="flex gap-3 px-4 pt-3">
        <Avatar className="size-10">
          {author.avatar && <AvatarImage src={author.avatar} />}
          <AvatarFallback>
            {author.fallback ?? author.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate font-bold text-[0.9375rem] leading-tight">
              {author.name}
            </span>
            <XVerifiedBadge className="size-[1.125rem] shrink-0" />
            {author.handle && (
              <span className="truncate text-[0.9375rem] text-muted-foreground">
                @{author.handle}
              </span>
            )}
            {timestamp && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="shrink-0 text-[0.9375rem] text-muted-foreground">
                  {timestamp}
                </span>
              </>
            )}
            <Button
              className="ml-auto text-muted-foreground"
              size="icon-sm"
              variant="ghost"
            >
              <HugeiconsIcon className="size-4" icon={MoreHorizontalIcon} />
            </Button>
          </div>

          <div className="pb-3">
            {isEditable ? (
              <div className="space-y-1">
                <Textarea
                  className="min-h-[4rem] resize-none rounded-none border-none bg-transparent p-0 text-[0.9375rem] leading-snug shadow-none focus-visible:ring-0"
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalValue(value);
                    onContentChange?.(value);
                  }}
                  placeholder="What is happening?!"
                  value={localValue}
                />
                <div className="flex justify-end">
                  <CharacterCounter count={localValue.length} />
                </div>
              </div>
            ) : content ? (
              <TweetContent
                content={content}
                onSelectionChange={onSelectionChange}
              />
            ) : null}

            <div className="mt-2 flex items-center justify-between">
              <Button
                className="gap-1.5 text-muted-foreground"
                size="icon-sm"
                variant="ghost"
              >
                <HugeiconsIcon className="size-4" icon={Comment01Icon} />
              </Button>
              <Button
                className="gap-1.5 text-muted-foreground"
                size="icon-sm"
                variant="ghost"
              >
                <HugeiconsIcon className="size-4" icon={RepeatIcon} />
              </Button>
              <Button
                className="gap-1.5 text-muted-foreground"
                size="icon-sm"
                variant="ghost"
              >
                <HugeiconsIcon className="size-4" icon={FavouriteIcon} />
              </Button>
              <div className="flex items-center gap-0.5">
                <Button
                  className="text-muted-foreground"
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon className="size-4" icon={Bookmark02Icon} />
                </Button>
                <Button
                  className="text-muted-foreground"
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon className="size-4" icon={Share01Icon} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { TwitterPost, type TwitterPostProps };
