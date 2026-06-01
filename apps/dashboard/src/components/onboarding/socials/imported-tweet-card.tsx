import {
  Delete02Icon,
  FavouriteIcon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/button";
import type { ImportedTweetCardProps } from "@/types/components/socials-onboarding";
import type { TweetMetadata } from "@/types/hooks/brand-references";
import { formatCompactNumber } from "@/utils/format-compact-number";
import { formatRelativeDate } from "@/utils/format-relative-date";
import { formatTweetContent } from "@/utils/format-tweet-content";

export function ImportedTweetCard({
  isDeleting,
  onDelete,
  reference,
}: ImportedTweetCardProps) {
  const metadata = reference.metadata as TweetMetadata | null;
  const hasStats =
    (metadata?.likes ?? 0) > 0 ||
    (metadata?.retweets ?? 0) > 0 ||
    (metadata?.replies ?? 0) > 0;

  return (
    <div className="break-inside-avoid rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Avatar className="size-9 rounded-full after:rounded-full" size="sm">
            {metadata?.profileImageUrl && (
              <AvatarImage src={metadata.profileImageUrl} />
            )}
            <AvatarFallback>
              {(metadata?.authorHandle ?? "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate font-medium text-sm">
                {metadata?.authorName ?? "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              {metadata?.authorHandle && <span>@{metadata.authorHandle}</span>}
              {metadata?.createdAt && (
                <>
                  <span>·</span>
                  <span>{formatRelativeDate(metadata.createdAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          disabled={isDeleting}
          onClick={() => onDelete(reference)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {isDeleting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-4" icon={Delete02Icon} />
          )}
        </Button>
      </div>

      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
        {formatTweetContent(reference.content)}
      </div>

      {hasStats ? (
        <div className="mt-3 flex items-center gap-3 text-muted-foreground text-xs">
          {(metadata?.retweets ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <HugeiconsIcon className="size-3.5" icon={RepeatIcon} />
              {formatCompactNumber(metadata?.retweets ?? 0)}
            </span>
          )}
          {(metadata?.likes ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <HugeiconsIcon className="size-3.5" icon={FavouriteIcon} />
              {formatCompactNumber(metadata?.likes ?? 0)}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
