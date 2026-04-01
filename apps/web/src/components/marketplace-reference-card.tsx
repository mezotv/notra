import {
  Comment01Icon,
  FavouriteIcon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MarketplaceReference } from "~types/marketplace";
import {
  CompanyLogoWithFallback,
  PlatformIcon,
  VerifiedBadge,
} from "./marketplace-icons";

const TRAILING_ZERO_REGEX = /\.0$/;

function formatCompactNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}K`;
  }
  return String(num);
}

const TYPE_LABELS: Record<string, string> = {
  twitter_post: "Twitter",
  linkedin_post: "LinkedIn",
  blog_post: "Blog",
  custom: "Custom",
};

const TYPE_COLORS: Record<string, string> = {
  twitter_post: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  linkedin_post:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  blog_post:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  custom:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

interface TweetMetadata {
  authorName?: string;
  authorHandle?: string;
  authorUrl?: string;
  verified?: "blue" | "gold";
  likes?: number;
  retweets?: number;
  replies?: number;
  createdAt?: string;
}

export function MarketplaceReferenceCard({
  reference,
}: {
  reference: MarketplaceReference;
}) {
  const meta = reference.metadata as TweetMetadata | null;
  const isTweet = reference.type === "twitter_post";

  return (
    <div className="flex break-inside-avoid flex-col overflow-hidden rounded-xl border border-border/80">
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {isTweet && meta?.authorName ? (
              <>
                {meta.authorUrl ? (
                  <CompanyLogoWithFallback
                    accentColor={null}
                    name={meta.authorName}
                    size={36}
                    websiteUrl={meta.authorUrl}
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted font-semibold text-muted-foreground text-xs">
                    {meta.authorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="flex items-center gap-1 truncate font-semibold text-sm leading-tight">
                    {meta.authorName}
                    {meta.verified && (
                      <VerifiedBadge
                        className="size-4 shrink-0"
                        variant={meta.verified}
                      />
                    )}
                  </span>
                  {meta.authorHandle && (
                    <div className="flex items-center gap-1">
                      <span className="truncate text-muted-foreground text-xs">
                        @{meta.authorHandle}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${TYPE_COLORS[reference.type] ?? TYPE_COLORS.custom}`}
              >
                {TYPE_LABELS[reference.type] ?? "Reference"}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <PlatformIcon
              className="size-3.5 text-muted-foreground"
              type={reference.type}
            />
            <span
              className={`rounded-full px-2 py-0.5 text-[0.6875rem] ${TYPE_COLORS[reference.type] ?? TYPE_COLORS.custom}`}
            >
              {TYPE_LABELS[reference.type] ?? "Reference"}
            </span>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed">
          {reference.content}
        </p>

        {isTweet && meta && (
          <div className="flex items-center gap-3 pt-0.5">
            {meta.replies !== undefined && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={Comment01Icon} />
                {formatCompactNumber(meta.replies)}
              </span>
            )}
            {meta.retweets !== undefined && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={RepeatIcon} />
                {formatCompactNumber(meta.retweets)}
              </span>
            )}
            {meta.likes !== undefined && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={FavouriteIcon} />
                {formatCompactNumber(meta.likes)}
              </span>
            )}
          </div>
        )}
      </div>

      {reference.note && (
        <div className="border-t bg-muted/50 px-4 py-2.5">
          <span className="text-muted-foreground text-xs">
            {reference.note}
          </span>
        </div>
      )}
    </div>
  );
}
