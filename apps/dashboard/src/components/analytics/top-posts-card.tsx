"use client";

import { Linkedin02Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { TOP_POST_CONTENT_PREVIEW_LENGTH } from "@/constants/analytics";
import type { TopPostItem } from "@/types/analytics";
import { formatDayLabel, formatMetric } from "@/utils/analytics-charts";

interface TopPostsCardProps {
  posts: TopPostItem[];
}

function previewContent(content: string): string {
  const singleLine = content.replace(/\s+/g, " ").trim();
  if (singleLine.length <= TOP_POST_CONTENT_PREVIEW_LENGTH) {
    return singleLine;
  }
  return `${singleLine.slice(0, TOP_POST_CONTENT_PREVIEW_LENGTH)}…`;
}

function PostAvatar({ post }: { post: TopPostItem }) {
  const name = post.username ?? post.providerAccountId;
  return (
    <Avatar className="size-7 shrink-0">
      {post.profileImageUrl && (
        <AvatarImage alt={name} src={post.profileImageUrl} />
      )}
      <AvatarFallback className="text-[0.625rem]">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function PostRow({ post }: { post: TopPostItem }) {
  const body = (
    <div className="flex items-start gap-3">
      <PostAvatar post={post} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted-foreground">
          <HugeiconsIcon
            icon={
              post.provider === "linkedin" ? Linkedin02Icon : NewTwitterIcon
            }
            size={12}
          />
          {post.username ? `@${post.username}` : post.providerAccountId}
          <span>·</span>
          {formatDayLabel(post.postedAt.slice(0, 10))}
        </p>
        <p className="text-sm leading-snug">{previewContent(post.content)}</p>
        <p className="font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          {formatMetric(post.likes)} likes · {formatMetric(post.replies)}{" "}
          replies · {formatMetric(post.reposts)} reposts
          {post.impressions !== null &&
            ` · ${formatMetric(post.impressions)} impressions`}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm tabular-nums">
        {formatMetric(post.engagement)}
      </span>
    </div>
  );

  if (post.url) {
    return (
      <a
        className="block px-1 py-2.5 transition-colors hover:bg-muted/60"
        href={post.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {body}
      </a>
    );
  }
  return <div className="px-1 py-2.5">{body}</div>;
}

export function TopPostsCard({ posts }: TopPostsCardProps) {
  return (
    <InstrumentModule eyebrow="Top posts" readout="latest sync, by engagement">
      {posts.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="No tracked posts yet"
          seed="Top posts"
        />
      ) : (
        <div className="-mx-1 divide-y divide-border">
          {posts.map((post) => (
            <PostRow
              key={`${post.provider}:${post.platformPostId}`}
              post={post}
            />
          ))}
        </div>
      )}
    </InstrumentModule>
  );
}
