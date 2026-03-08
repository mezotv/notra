"use client";

import {
  Comment01Icon,
  Delete02Icon,
  Edit02Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";
import type {
  ReferenceCardProps,
  TweetMetadata,
} from "@/types/hooks/brand-references";
import { formatTweetContent } from "@/utils/format-tweet-content";

const PLATFORM_OPTIONS = [
  { value: "all", label: "All platforms" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "blog", label: "Blog & Changelog" },
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  all: "All",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  blog: "Blog",
};

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

function PlatformBadges({ applicableTo }: { applicableTo: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {applicableTo.map((platform) => (
        <span
          className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground"
          key={platform}
        >
          {PLATFORM_LABELS[platform] ?? platform}
        </span>
      ))}
    </div>
  );
}

function EditPlatformsDialog({
  open,
  onOpenChange,
  applicableTo,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicableTo: string[];
  onSave: (platforms: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(applicableTo);

  const togglePlatform = (value: string) => {
    if (value === "all") {
      setSelected(["all"]);
      return;
    }
    const withoutAll = selected.filter((v) => v !== "all");
    const updated = withoutAll.includes(value)
      ? withoutAll.filter((v) => v !== value)
      : [...withoutAll, value];
    setSelected(updated.length === 0 ? ["all"] : updated);
  };

  const handleSave = () => {
    onSave(selected);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit platforms</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Choose which AI agents can use this reference.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-3 py-4">
          <Label>Use for</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((option) => (
              <button
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected.includes(option.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
                key={option.value}
                onClick={() => togglePlatform(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function CardMenu({
  referenceId,
  applicableTo,
  onDelete,
  onUpdateApplicableTo,
  isDeleting,
}: {
  referenceId: string;
  applicableTo: string[];
  onDelete: () => void;
  onUpdateApplicableTo: (id: string, applicableTo: string[]) => void;
  isDeleting: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          nativeButton={false}
          render={<span />}
        >
          <HugeiconsIcon className="size-4" icon={MoreHorizontalIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <HugeiconsIcon className="size-4" icon={Edit02Icon} />
            Edit reference
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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

      <EditPlatformsDialog
        applicableTo={applicableTo}
        onOpenChange={setEditOpen}
        onSave={(platforms) => onUpdateApplicableTo(referenceId, platforms)}
        open={editOpen}
      />
    </>
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
          <div className="flex shrink-0 items-center gap-1.5">
            <PlatformBadges applicableTo={reference.applicableTo} />
            <CardMenu
              applicableTo={reference.applicableTo}
              isDeleting={isDeleting}
              onDelete={() => onDelete(reference.id)}
              onUpdateApplicableTo={onUpdateApplicableTo}
              referenceId={reference.id}
            />
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed">
          {formatTweetContent(reference.content)}
        </p>

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
          <div className="flex shrink-0 items-center gap-1.5">
            <PlatformBadges applicableTo={reference.applicableTo} />
            <CardMenu
              applicableTo={reference.applicableTo}
              isDeleting={isDeleting}
              onDelete={() => onDelete(reference.id)}
              onUpdateApplicableTo={onUpdateApplicableTo}
              referenceId={reference.id}
            />
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed">
          {formatTweetContent(reference.content)}
        </p>
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
