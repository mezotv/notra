"use client";

import { Linkedin02Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { DelayedTooltip } from "@/components/delayed-tooltip";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { ANALYTICS_TOOLTIP_DELAY_MS } from "@/constants/analytics";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { TopPostItem, TopPostsCardProps } from "@/types/analytics";
import {
  formatDayLabel,
  formatMetric,
  previewPostContent,
} from "@/utils/analytics-charts";
import { tableHeightFor } from "@/utils/table";

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

export function TopPostsCard({ posts, action }: TopPostsCardProps) {
  const columns = useMemo<TableColumn<TopPostItem>[]>(
    () => [
      {
        key: "account",
        header: "Account",
        width: "7rem",
        sortable: true,
        cell: (row) => (
          <DelayedTooltip delay={ANALYTICS_TOOLTIP_DELAY_MS}>
            <TooltipTrigger
              render={<span className="flex items-center gap-2" />}
            >
              <PostAvatar post={row} />
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={
                  row.provider === "linkedin" ? Linkedin02Icon : NewTwitterIcon
                }
                size={12}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">
                {row.username ? `@${row.username}` : "-"}
              </p>
            </TooltipContent>
          </DelayedTooltip>
        ),
        sortValue: (row) => row.username ?? row.providerAccountId,
      },
      {
        key: "content",
        header:
          posts.length > 0 ? `Post (${posts.length.toLocaleString()})` : "Post",
        width: "2.6fr",
        cell: (row) => (
          <DelayedTooltip delay={ANALYTICS_TOOLTIP_DELAY_MS}>
            <TooltipTrigger
              render={
                <span className="block w-full min-w-0 truncate text-left text-sm leading-snug" />
              }
            >
              {previewPostContent(row.content)}
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs leading-snug">{row.content}</p>
            </TooltipContent>
          </DelayedTooltip>
        ),
      },
      {
        key: "postedAt",
        header: "Posted",
        width: "7.5rem",
        sortable: true,
        cell: (row) => (
          <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
            {formatDayLabel(row.postedAt.slice(0, 10))}
          </span>
        ),
      },
      {
        key: "impressions",
        header: "Impressions",
        width: "8.5rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-muted-foreground text-sm tabular-nums">
            {row.impressions === null ? "-" : formatMetric(row.impressions)}
          </span>
        ),
        sortValue: (row) => row.impressions ?? 0,
      },
      {
        key: "engagement",
        header: "Engagement",
        width: "9rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm tabular-nums">
            {formatMetric(row.engagement)}
          </span>
        ),
      },
    ],
    [posts.length]
  );

  return (
    <InstrumentModule
      action={action}
      bareBody
      eyebrow="Top posts"
      variant="panel"
    >
      {posts.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="No posts for this time frame"
          seed="Top posts"
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={columns}
          data={posts}
          defaultSort={{ key: "engagement", direction: "desc" }}
          emptyState="No posts for this time frame"
          getRowId={(row) => `${row.provider}:${row.platformPostId}`}
          height={tableHeightFor(posts.length)}
          onRowClick={(row) => {
            if (row.url) {
              window.open(row.url, "_blank", "noopener,noreferrer");
            }
          }}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      )}
    </InstrumentModule>
  );
}
