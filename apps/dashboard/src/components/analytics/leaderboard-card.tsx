"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { XVerificationBadge } from "@/components/icons/x-verification-badge";
import { LEADERBOARD_WINDOWS } from "@/constants/analytics";

const LEADING_AT = /^@/;

import {
  useLeaderboard,
  useTrackAccount,
  useUntrackAccount,
} from "@/lib/hooks/use-social-analytics";
import { cn } from "@/lib/utils";
import { isSquareTwitterAvatar } from "@/utils/twitter";
import type {
  LeaderboardEntry,
  LeaderboardWindow,
  SocialOverviewAccount,
} from "@/types/analytics";
import { formatMetric } from "@/utils/analytics-charts";

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

function RankChange({ entry }: { entry: LeaderboardEntry }) {
  if (entry.rankChange === null || entry.rankChange === 0) {
    return <span className="text-muted-foreground">–</span>;
  }
  const up = entry.rankChange > 0;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        up ? "text-green-500" : "text-red-500"
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(entry.rankChange)}
    </span>
  );
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
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 text-left"
          onClick={onToggleExpand}
          type="button"
        >
          <span className="w-6 shrink-0 text-center font-semibold text-lg tabular-nums">
            {entry.rank}
          </span>
          <span className="w-8 shrink-0 text-center">
            <RankChange entry={entry} />
          </span>
          <Avatar
            className={cn(
              "size-9 shrink-0",
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
            <p className="truncate text-muted-foreground text-xs">
              @{entry.username}
            </p>
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums">
            {formatMetric(entry.interactions)}
          </span>
          <span className="hidden w-24 shrink-0 text-right text-sm tabular-nums sm:block">
            {formatMetric(entry.impressions)}
          </span>
          <span className="hidden w-16 shrink-0 text-right text-sm tabular-nums sm:block">
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
        <dl className="mb-2 grid grid-cols-4 gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-8">
          {detailMetrics(detail).map((metric) => (
            <div key={metric.label}>
              <dt className="text-muted-foreground text-xs">{metric.label}</dt>
              <dd className="font-semibold text-sm tabular-nums">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {expanded && !detail && (
        <p className="mb-2 rounded-md bg-muted/40 p-3 text-muted-foreground text-xs">
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
  const [handle, setHandle] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const detailsByUsername = new Map(
    accountDetails.map((account) => [account.username.toLowerCase(), account])
  );
  const { data } = useLeaderboard(organizationId, days);
  const track = useTrackAccount(organizationId);

  const entries = data?.entries ?? [];

  const handleTrack = () => {
    const username = handle.trim().replace(LEADING_AT, "");
    if (username.length === 0) {
      return;
    }
    track.mutate(username, { onSuccess: () => setHandle("") });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <h2 className="font-semibold leading-none tracking-tight">
            Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Connected and tracked accounts ranked by interactions
          </p>
        </div>
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
          <SelectTrigger className="w-28">
            <SelectValue>{`Last ${days}d`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEADERBOARD_WINDOWS.map((window) => (
              <SelectItem key={window} value={String(window)}>
                Last {window}d
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 border-b pb-2 text-muted-foreground text-xs">
          <span className="w-6 text-center">Rank</span>
          <span
            className="w-8 text-center"
            title="Rank change vs the previous period"
          >
            Δ
          </span>
          <span className="w-9" />
          <span className="flex-1">Account</span>
          <span className="w-24 text-right">Interactions</span>
          <span className="hidden w-24 text-right sm:block">Impressions</span>
          <span className="hidden w-16 text-right sm:block">Posts</span>
          <span className="w-8" />
        </div>
        {entries.length === 0 ? (
          <p className="flex h-32 items-center justify-center text-muted-foreground text-sm">
            No accounts yet
          </p>
        ) : (
          <div className="divide-y">
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
        <div className="flex gap-2 border-t pt-3">
          <Input
            onChange={(event) => setHandle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleTrack();
              }
            }}
            placeholder="@handle to track (teammates, affiliates)"
            value={handle}
          />
          <Button
            disabled={handle.trim().length === 0 || track.isPending}
            onClick={handleTrack}
            variant="outline"
          >
            {track.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Track
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
