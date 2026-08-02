"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AccountFilter } from "@/components/analytics/account-filter";
import { AccountSeriesChartCard } from "@/components/analytics/account-series-chart-card";
import { ConnectAccountsButtons } from "@/components/analytics/connect-accounts-buttons";
import { FollowersCard } from "@/components/analytics/followers-card";
import { LeaderboardCard } from "@/components/analytics/leaderboard-card";
import { PostingPerformanceCard } from "@/components/analytics/posting-performance-card";
import { SummaryStats } from "@/components/analytics/summary-stats";
import { TopPostsCard } from "@/components/analytics/top-posts-card";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  ACCOUNT_SERIES_COLORS,
  ANALYTICS_TIMESERIES_DAYS,
} from "@/constants/analytics";
import {
  useEngagementTimeseries,
  useFollowerGrowth,
  useNotraAdoption,
  usePostingPerformance,
  useSocialOverview,
  useTopPosts,
} from "@/lib/hooks/use-social-analytics";
import type { TimelineMarker } from "@/types/analytics";
import {
  accountSeriesKey,
  buildAccountSeriesRows,
  buildPostingPerformanceRows,
  buildTimelineDays,
  markerIndexForDate,
} from "@/utils/analytics-charts";
import { AnalyticsPageSkeleton } from "./skeleton";

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: overview, isPending: isOverviewPending } =
    useSocialOverview(organizationId);
  const { data: engagement } = useEngagementTimeseries(organizationId);
  const { data: followerGrowth } = useFollowerGrowth(organizationId);
  const { data: topPosts } = useTopPosts(organizationId);
  const { data: performance } = usePostingPerformance(organizationId);
  const { data: adoption } = useNotraAdoption(organizationId);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const accounts = useMemo(
    () => overview?.accounts ?? [],
    [overview?.accounts]
  );

  const accountConfig = useMemo(() => {
    const config: ChartConfig = {};
    accounts.forEach((account, index) => {
      config[accountSeriesKey(account.provider, account.providerAccountId)] = {
        label: `@${account.username}`,
        color:
          ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ?? "blue",
      };
    });
    return config;
  }, [accounts]);

  const allKeys = useMemo(
    () =>
      accounts.map((account) =>
        accountSeriesKey(account.provider, account.providerAccountId)
      ),
    [accounts]
  );

  const visibleKeys = useMemo(
    () => allKeys.filter((key) => !hiddenKeys.has(key)),
    [allKeys, hiddenKeys]
  );

  const selectedKeys = useMemo(() => new Set(visibleKeys), [visibleKeys]);

  const timelineDays = useMemo(
    () => buildTimelineDays(ANALYTICS_TIMESERIES_DAYS),
    []
  );

  const engagementRows = useMemo(
    () =>
      buildAccountSeriesRows(
        timelineDays,
        visibleKeys,
        engagement?.points ?? [],
        (point) =>
          (point.likes ?? 0) + (point.replies ?? 0) + (point.reposts ?? 0)
      ),
    [timelineDays, visibleKeys, engagement?.points]
  );

  const impressionRows = useMemo(
    () =>
      buildAccountSeriesRows(
        timelineDays,
        visibleKeys,
        engagement?.points ?? [],
        (point) => point.impressions ?? 0
      ),
    [timelineDays, visibleKeys, engagement?.points]
  );

  const postRows = useMemo(
    () =>
      buildAccountSeriesRows(
        timelineDays,
        visibleKeys,
        engagement?.points ?? [],
        (point) => point.posts
      ),
    [timelineDays, visibleKeys, engagement?.points]
  );

  const markers = useMemo(() => {
    const result: TimelineMarker[] = [];
    const joined = markerIndexForDate(
      timelineDays,
      adoption?.organizationCreatedAt ?? null
    );
    if (joined !== null) {
      result.push({ index: joined, label: "Joined Notra" });
    }
    const firstPost = markerIndexForDate(
      timelineDays,
      adoption?.firstNotraPostAt ?? null
    );
    if (firstPost !== null && firstPost !== joined) {
      result.push({ index: firstPost, label: "First Notra post" });
    }
    return result;
  }, [timelineDays, adoption]);

  const performanceRows = useMemo(
    () => buildPostingPerformanceRows(performance?.points ?? []),
    [performance?.points]
  );

  const toggleAccount = (key: string) => {
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (isOverviewPending) {
    return <AnalyticsPageSkeleton />;
  }

  if (accounts.length === 0) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-semibold text-2xl">Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Performance of your connected X and LinkedIn accounts
            </p>
          </header>
          <EmptyState
            action={
              <Link
                className="text-primary text-sm underline underline-offset-4"
                href={`/${organizationSlug}/settings/general`}
              >
                Connect an account
              </Link>
            }
            description="Connect an X or LinkedIn account to start tracking followers, impressions, and engagement."
            title="No connected accounts"
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-semibold text-2xl">Analytics</h1>
              <p className="text-muted-foreground text-sm">
                {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"} connected on X
                and LinkedIn
              </p>
            </div>
            <ConnectAccountsButtons organizationId={organizationId} />
          </div>
          <AccountFilter
            accounts={accounts}
            onToggle={toggleAccount}
            selectedKeys={selectedKeys}
          />
        </header>

        {overview?.configured === false && (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
            Analytics ingestion is not configured yet. Connected accounts are
            shown, but stats will appear once the analytics backend is set up.
          </p>
        )}

        <SummaryStats accounts={accounts} points={engagement?.points ?? []} />

        <section className="space-y-3">
          <SectionHeader
            description="Every account you post from or track, ranked by interactions"
            title="Accounts"
          />
          <LeaderboardCard
            accountDetails={accounts}
            organizationId={organizationId}
          />
        </section>

        <section className="space-y-3">
          <SectionHeader
            description="Hover any chart to compare the same day everywhere"
            title="Trends"
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <AccountSeriesChartCard
              allKeys={allKeys}
              config={accountConfig}
              description="Likes, replies, and reposts by publish date"
              emptyMessage="No engagement data yet"
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="area"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              rows={engagementRows}
              title="Engagement"
            />
            <AccountSeriesChartCard
              allKeys={allKeys}
              config={accountConfig}
              description="Impressions by publish date"
              emptyMessage="No impression data yet"
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="area"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              rows={impressionRows}
              title="Impressions"
            />
            <AccountSeriesChartCard
              allKeys={allKeys}
              config={accountConfig}
              description="Posts published per day"
              emptyMessage="No posts tracked yet"
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="bar"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              rows={postRows}
              title="Publishing volume"
            />
            <FollowersCard
              accounts={accounts}
              colorForKey={(key) => accountConfig[key]?.color ?? "blue"}
              hiddenKeys={hiddenKeys}
              points={followerGrowth?.points ?? []}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            description="When to post and which posts carry the numbers"
            title="What works"
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <PostingPerformanceCard rows={performanceRows} />
            <TopPostsCard posts={topPosts?.posts ?? []} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
