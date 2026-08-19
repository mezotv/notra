"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { ChartSparkline } from "@/components/charts/chart-sparkline";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { cn } from "@/lib/utils";
import type {
  FollowerGrowthPoint,
  FollowersCardProps,
} from "@/types/analytics";
import { accountSeriesKey, formatMetric } from "@/utils/analytics-charts";

function seriesFor(
  points: FollowerGrowthPoint[],
  provider: string,
  providerAccountId: string
): number[] {
  return points
    .filter(
      (point) =>
        point.provider === provider &&
        point.providerAccountId === providerAccountId &&
        point.followersCount !== null
    )
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((point) => point.followersCount ?? 0);
}

function DeltaBadge({ series }: { series: number[] }) {
  const first = series.at(0);
  const last = series.at(-1);
  if (first === undefined || last === undefined || series.length < 2) {
    return (
      <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted-foreground">
        tracking started
      </span>
    );
  }
  const delta = last - first;
  if (delta === 0) {
    return (
      <span className="font-mono text-[0.6875rem] text-muted-foreground">
        ±0
      </span>
    );
  }
  return (
    <span
      className={cn(
        "font-mono text-[0.6875rem] tabular-nums",
        delta > 0 ? "text-green-500" : "text-red-500"
      )}
    >
      {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toLocaleString()}
    </span>
  );
}

export function FollowersCard({
  accounts,
  points,
  hiddenKeys,
  colorForKey,
  action,
  markIncompleteTail,
}: FollowersCardProps) {
  const visible = accounts.filter(
    (account) =>
      !hiddenKeys.has(
        accountSeriesKey(account.provider, account.providerAccountId)
      )
  );

  return (
    <InstrumentModule action={action} eyebrow="Followers" variant="panel">
      {visible.length === 0 ? (
        <InstrumentEmpty
          className="h-56"
          message="No accounts selected"
          seed="Followers"
        />
      ) : (
        <div className="flex h-56 flex-col justify-center divide-y divide-border">
          {visible.map((account) => {
            const key = accountSeriesKey(
              account.provider,
              account.providerAccountId
            );
            const series = seriesFor(
              points,
              account.provider,
              account.providerAccountId
            );
            return (
              <div className="flex items-center gap-3 py-2.5" key={key}>
                <Avatar className="size-8 shrink-0">
                  {account.profileImageUrl && (
                    <AvatarImage
                      alt={account.username}
                      src={account.profileImageUrl}
                    />
                  )}
                  <AvatarFallback className="text-[0.625rem]">
                    {account.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[0.6875rem] text-muted-foreground">
                    @{account.username}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl tabular-nums tracking-tight">
                      {formatMetric(account.followersCount)}
                    </span>
                    <DeltaBadge series={series} />
                  </div>
                </div>
                {series.length >= 2 && (
                  <div className="ml-auto h-10 w-2/5 min-w-24">
                    <ChartSparkline
                      className="h-full w-full"
                      color={colorForKey(key)}
                      data={series}
                      markIncompleteTail={markIncompleteTail}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </InstrumentModule>
  );
}
