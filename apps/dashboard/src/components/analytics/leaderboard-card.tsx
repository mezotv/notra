"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useState } from "react";
import { XVerificationBadge } from "@/components/icons/x-verification-badge";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { LEADERBOARD_WINDOWS } from "@/constants/analytics";

import {
  useLeaderboard,
  useUntrackAccount,
} from "@/lib/hooks/use-social-analytics";
import { cn } from "@/lib/utils";
import type {
  LeaderboardEntry,
  LeaderboardWindow,
  SocialOverviewAccount,
} from "@/types/analytics";
import { formatMetric } from "@/utils/analytics-charts";
import { isSquareTwitterAvatar } from "@/utils/twitter";

interface LeaderboardCardProps {
  organizationId: string;
  accountDetails: SocialOverviewAccount[];
}

interface DetailMetric {
  label: string;
  value: string;
}

function detailMetrics(account: SocialOverviewAccount): DetailMetric[] {
  const interactions =
    (account.likes ?? 0) + (account.replies ?? 0) + (account.reposts ?? 0);
  const engagementRate =
    account.impressions && account.impressions > 0
      ? `${((interactions / account.impressions) * 100).toFixed(1)}%`
      : "N/A";
  return [
    { label: "Followers", value: formatMetric(account.followersCount) },
    { label: "Impressions", value: formatMetric(account.impressions) },
    { label: "Likes", value: formatMetric(account.likes) },
    { label: "Replies", value: formatMetric(account.replies) },
    { label: "Reposts", value: formatMetric(account.reposts) },
    { label: "Quotes", value: formatMetric(account.quotes) },
    { label: "Bookmarks", value: formatMetric(account.bookmarks) },
    { label: "Eng. rate", value: engagementRate },
  ];
}

function LeaderboardRow({
  entry,
  organizationId,
  detail,
  expanded,
  onToggleExpand,
}: {
  entry: LeaderboardEntry;
  organizationId: string;
  detail: SocialOverviewAccount | null;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const untrack = useUntrackAccount(organizationId);

  return (
    <div>
      <div className="group flex items-center gap-3">
        <button
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 text-left"
          onClick={onToggleExpand}
          type="button"
        >
          <span className="w-6 shrink-0 text-center font-mono text-base tabular-nums">
            {entry.rank}
          </span>
          <Avatar
            className={cn(
              "size-8 shrink-0",
              isSquareTwitterAvatar(entry.verifiedType) && "rounded-md"
            )}
          >
            {entry.profileImageUrl && (
              <AvatarImage
                alt={entry.displayName ?? entry.username}
                className={cn(
                  isSquareTwitterAvatar(entry.verifiedType) && "rounded-md"
                )}
                src={entry.profileImageUrl}
              />
            )}
            <AvatarFallback className="text-[0.625rem]">
              {entry.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-medium text-sm">
              <span className="truncate">
                {entry.displayName ?? entry.username}
              </span>
              <XVerificationBadge
                className="size-3.5 shrink-0"
                verified={entry.verified}
                verifiedType={entry.verifiedType}
              />
            </p>
            <p className="truncate font-mono text-[0.6875rem] text-muted-foreground">
              @{entry.username}
            </p>
          </div>
          <span className="w-24 shrink-0 text-right font-mono text-sm tabular-nums">
            {formatMetric(entry.interactions)}
          </span>
          <span className="hidden w-24 shrink-0 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
            {formatMetric(entry.impressions)}
          </span>
          <span className="hidden w-16 shrink-0 text-right font-mono text-muted-foreground text-sm tabular-nums sm:block">
            {entry.posts}
          </span>
        </button>
        <span className="w-8 shrink-0">
          {entry.trackedAccountId && (
            <Button
              aria-label={`Stop tracking @${entry.username}`}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              disabled={untrack.isPending}
              onClick={() => {
                if (entry.trackedAccountId) {
                  untrack.mutate(entry.trackedAccountId);
                }
              }}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </Button>
          )}
        </span>
      </div>
      {expanded && detail && (
        <dl className="mb-2 grid grid-cols-4 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-8">
          {detailMetrics(detail).map((metric) => (
            <div className="bg-muted/40 px-2 py-1.5" key={metric.label}>
              <dt className="font-mono text-[0.5625rem] text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </dt>
              <dd className="font-mono text-sm tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {expanded && !detail && (
        <p className="mb-2 rounded-sm border border-border px-3 py-2 font-mono text-[0.6875rem] text-muted-foreground">
          Lifetime stats appear after this account's first sync
        </p>
      )}
    </div>
  );
}

export function LeaderboardCard({
  organizationId,
  accountDetails,
}: LeaderboardCardProps) {
  const [days, setDays] = useState<LeaderboardWindow>(7);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const detailsByUsername = new Map(
    accountDetails.map((account) => [account.username.toLowerCase(), account])
  );
  const { data } = useLeaderboard(organizationId, days);

  const entries = data?.entries ?? [];

  return (
    <InstrumentModule
      action={
        <Select
          onValueChange={(value) => {
            const parsed = LEADERBOARD_WINDOWS.find(
              (window) => String(window) === value
            );
            if (parsed) {
              setDays(parsed);
            }
          }}
          value={String(days)}
        >
          <SelectTrigger
            className="h-6 gap-1 rounded-sm border-border px-2 font-mono text-[0.6875rem] data-[size=sm]:h-6"
            size="sm"
          >
            <SelectValue>{`${days}D`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEADERBOARD_WINDOWS.map((window) => (
              <SelectItem key={window} value={String(window)}>
                Last {window}d
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      eyebrow="Leaderboard"
      readout="ranked by interactions"
    >
      <div className="flex items-center gap-3 border-border border-b pb-1.5 font-mono text-[0.625rem] text-muted-foreground uppercase tracking-wider">
        <span className="w-6 text-center">Rk</span>
        <span className="w-8" />
        <span className="flex-1">Account</span>
        <span className="w-24 text-right">Interact</span>
        <span className="hidden w-24 text-right sm:block">Impress</span>
        <span className="hidden w-16 text-right sm:block">Posts</span>
        <span className="w-8" />
      </div>
      {entries.length === 0 ? (
        <InstrumentEmpty
          className="h-32"
          message="No accounts yet"
          seed="Leaderboard"
        />
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <LeaderboardRow
              detail={
                detailsByUsername.get(entry.username.toLowerCase()) ?? null
              }
              entry={entry}
              expanded={expandedKey === entry.key}
              key={entry.key}
              onToggleExpand={() =>
                setExpandedKey((previous) =>
                  previous === entry.key ? null : entry.key
                )
              }
              organizationId={organizationId}
            />
          ))}
        </div>
      )}
    </InstrumentModule>
  );
}
