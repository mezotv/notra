"use client";

import {
  Comment01Icon,
  Delete02Icon,
  FavouriteIcon,
  Link04Icon,
  MoreHorizontalIcon,
  RepeatIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";
import type { BrandReference } from "@/types/hooks/brand-references";
import { formatTweetContent } from "@/utils/format-tweet-content";

interface ReferenceCardProps {
  reference: BrandReference;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string | null) => void;
  onUpdateApplicableTo: (id: string, applicableTo: string[]) => void;
  isDeleting: boolean;
}

interface TweetMetadata {
  authorHandle?: string;
  authorName?: string;
  profileImageUrl?: string;
  url?: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  createdAt?: string;
}

const TRAILING_ZERO_REGEX = /\.0$/;

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}K`;
  }
  return String(num);
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ReferenceCard({
  reference,
  onDelete,
  onUpdateNote,
  onUpdateApplicableTo,
  isDeleting,
}: ReferenceCardProps) {
  if (reference.type === "custom") {
    return (
      <CustomReferenceCard
        isDeleting={isDeleting}
        onDelete={onDelete}
        onUpdateApplicableTo={onUpdateApplicableTo}
        onUpdateNote={onUpdateNote}
        reference={reference}
      />
    );
  }

  return (
    <TwitterReferenceCard
      isDeleting={isDeleting}
      onDelete={onDelete}
      onUpdateApplicableTo={onUpdateApplicableTo}
      onUpdateNote={onUpdateNote}
      reference={reference}
    />
  );
}

function NoteInput({
  referenceId,
  initialNote,
  onUpdateNote,
}: {
  referenceId: string;
  initialNote: string | null;
  onUpdateNote: (id: string, note: string | null) => void;
}) {
  const [noteValue, setNoteValue] = useState(initialNote ?? "");

  const handleNoteBlur = () => {
    const trimmed = noteValue.trim();
    if (trimmed !== (initialNote ?? "")) {
      onUpdateNote(referenceId, trimmed || null);
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  return (
    <Textarea
      className="max-h-20 min-h-0 resize-none overflow-y-auto border-none bg-transparent px-0 py-1.5 text-xs shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
      onBlur={handleNoteBlur}
      onChange={(e) => setNoteValue(e.target.value)}
      onKeyDown={handleNoteKeyDown}
      placeholder="Add a note..."
      rows={1}
      value={noteValue}
    />
  );
}

function CardMenu({
  onDelete,
  isDeleting,
  externalUrl,
}: {
  onDelete: () => void;
  isDeleting: boolean;
  externalUrl?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        nativeButton={false}
        render={<span />}
      >
        <HugeiconsIcon className="size-4" icon={MoreHorizontalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {externalUrl && (
          <DropdownMenuItem
            onClick={() => window.open(externalUrl, "_blank", "noopener")}
          >
            <HugeiconsIcon className="size-4" icon={Link04Icon} />
            Visit original post
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isDeleting}
          onClick={onDelete}
          variant="destructive"
        >
          <HugeiconsIcon className="size-4" icon={Delete02Icon} />
          {isDeleting ? "Deleting..." : "Delete reference"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TwitterReferenceCard({
  reference,
  onDelete,
  onUpdateNote,
  onUpdateApplicableTo,
  isDeleting,
}: ReferenceCardProps) {
  const metadata = reference.metadata as TweetMetadata | null;
  const hasStats =
    (metadata?.likes ?? 0) > 0 ||
    (metadata?.retweets ?? 0) > 0 ||
    (metadata?.replies ?? 0) > 0;

  return (
    <div className="group flex break-inside-avoid flex-col overflow-hidden rounded-xl border transition-colors hover:border-border/80">
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar
              className="size-9 rounded-full after:rounded-full"
              size="sm"
            >
              {metadata?.profileImageUrl && (
                <AvatarImage src={metadata.profileImageUrl} />
              )}
              <AvatarFallback>
                {(metadata?.authorHandle ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate font-semibold text-sm leading-tight">
                  {metadata?.authorName ?? "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {metadata?.authorHandle && (
                  <span className="truncate text-muted-foreground text-xs">
                    @{metadata.authorHandle}
                  </span>
                )}
                {metadata?.createdAt && (
                  <>
                    <span className="text-muted-foreground/50 text-xs">·</span>
                    <span className="shrink-0 text-muted-foreground/70 text-xs">
                      {formatRelativeDate(metadata.createdAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <CardMenu
            externalUrl={metadata?.url}
            isDeleting={isDeleting}
            onDelete={() => onDelete(reference.id)}
          />
        </div>

        <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed">
          {formatTweetContent(reference.content)}
        </p>

        <PlatformBadges
          applicableTo={reference.applicableTo}
          onUpdate={onUpdateApplicableTo}
          referenceId={reference.id}
        />

        {hasStats && (
          <div className="flex items-center gap-3 pt-0.5">
            {(metadata?.replies ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={Comment01Icon} />
                {formatCompactNumber(metadata?.replies ?? 0)}
              </span>
            )}
            {(metadata?.retweets ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={RepeatIcon} />
                {formatCompactNumber(metadata?.retweets ?? 0)}
              </span>
            )}
            {(metadata?.likes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={FavouriteIcon} />
                {formatCompactNumber(metadata?.likes ?? 0)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-b-xl border-t bg-muted/50 px-4 py-1.5">
        <NoteInput
          initialNote={reference.note}
          onUpdateNote={onUpdateNote}
          referenceId={reference.id}
        />
      </div>
    </div>
  );
}

function CustomReferenceCard({
  reference,
  onDelete,
  onUpdateNote,
  onUpdateApplicableTo,
  isDeleting,
}: ReferenceCardProps) {
  return (
    <div className="group flex break-inside-avoid flex-col overflow-hidden rounded-xl border transition-colors hover:border-border/80">
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon
                className="size-4 text-muted-foreground"
                icon={TextIcon}
              />
            </div>
            <div>
              <span className="font-semibold text-sm leading-tight">
                Custom reference
              </span>
              <p className="text-muted-foreground/70 text-xs">
                {formatRelativeDate(reference.createdAt)}
              </p>
            </div>
          </div>
          <CardMenu
            isDeleting={isDeleting}
            onDelete={() => onDelete(reference.id)}
          />
        </div>

        <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed">
          {formatTweetContent(reference.content)}
        </p>

        <PlatformBadges
          applicableTo={reference.applicableTo}
          onUpdate={onUpdateApplicableTo}
          referenceId={reference.id}
        />
      </div>

      <div className="rounded-b-xl border-t bg-muted/50 px-4 py-1.5">
        <NoteInput
          initialNote={reference.note}
          onUpdateNote={onUpdateNote}
          referenceId={reference.id}
        />
      </div>
    </div>
  );
}

function PlatformBadges({
  referenceId,
  applicableTo,
  onUpdate,
}: {
  referenceId: string;
  applicableTo: string[];
  onUpdate: (id: string, applicableTo: string[]) => void;
}) {
  const togglePlatform = (value: string) => {
    if (value === "all") {
      onUpdate(referenceId, ["all"]);
      return;
    }
    const withoutAll = applicableTo.filter((v) => v !== "all");
    const updated = withoutAll.includes(value)
      ? withoutAll.filter((v) => v !== value)
      : [...withoutAll, value];
    onUpdate(referenceId, updated.length === 0 ? ["all"] : updated);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {PLATFORM_OPTIONS.map((option) => (
        <button
          className={`cursor-pointer rounded-full px-2 py-0.5 text-[0.6875rem] transition-colors ${
            applicableTo.includes(option.value)
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          key={option.value}
          onClick={() => togglePlatform(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const PLATFORM_OPTIONS = [
  { value: "all", label: "All" },
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "changelog", label: "Changelog" },
] as const;
