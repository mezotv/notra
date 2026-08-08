"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { AccountFilter } from "@/components/analytics/account-filter";
import { AccountSeriesChartCard } from "@/components/analytics/account-series-chart-card";
import { ConnectAccountsButtons } from "@/components/analytics/connect-accounts-buttons";
import { FollowersCard } from "@/components/analytics/followers-card";
import { ImpressionsShareCard } from "@/components/analytics/impressions-share-card";
import { LeaderboardCard } from "@/components/analytics/leaderboard-card";
import { PostingPerformanceCard } from "@/components/analytics/posting-performance-card";
import { AnalyticsRangePicker } from "@/components/analytics/range-picker";
import { SummaryStats } from "@/components/analytics/summary-stats";
import { TopPostsCard } from "@/components/analytics/top-posts-card";
import { EmptyState } from "@/components/empty-state";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { ANALYTICS_TAB_VALUES } from "@/constants/analytics";
import { CHART_MUTED_COLOR } from "@/constants/charts";
import { buildTimelineRange, rangeHintLabel } from "@/lib/analytics/date-range";
import { useAnalyticsRange } from "@/lib/hooks/use-analytics-range";
import {
  useEngagementTimeseries,
  useFollowerGrowth,
  useNotraAdoption,
  usePostingPerformance,
  useSocialOverview,
  useTopPosts,
} from "@/lib/hooks/use-social-analytics";
import { cn } from "@/lib/utils";
import type { ChartColorPair } from "@/types/charts";
import {
  accountSeriesKey,
  buildAccountSeriesRows,
  buildAdoptionMarkers,
} from "@/utils/analytics-charts";
import {
  accountSeriesColorPair,
  accountSeriesColors,
} from "@/utils/chart-colors";
import { AnalyticsPageSkeleton } from "./skeleton";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Analytics instrument panel
 *
 * Read top-to-bottom. Each `at` value is ms after data mount.
 *
 *    0ms   header + account switches render statically
 *   60ms   master readout rail powers on,
 *          sync dot starts pulsing
 *  150ms   modules materialize over the grid substrate
 *          (staggered 45ms in reading order)
 *
 * Reduced motion: everything appears at once, no offsets.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  readoutRail: 60, // master readout rail powers on
  modules: 150, // grid modules start staggering in
};

const STAGE = {
  rail: 1, // readout rail visible
  modules: 2, // grid modules visible
};

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

  const engagementRange = useAnalyticsRange("engagementRange");
  const impressionsRange = useAnalyticsRange("impressionsRange");
  const volumeRange = useAnalyticsRange("volumeRange");
  const followersRange = useAnalyticsRange("followersRange");
  const bestTimeRange = useAnalyticsRange("bestTimeRange", "90d");
  const topPostsRange = useAnalyticsRange("topPostsRange");

  const { data: overview, isPending: isOverviewPending } =
    useSocialOverview(organizationId);
  const { data: engagement } = useEngagementTimeseries(
    organizationId,
    engagementRange.range
  );
  const { data: impressionSeries } = useEngagementTimeseries(
    organizationId,
    impressionsRange.range
  );
  const { data: volumeSeries } = useEngagementTimeseries(
    organizationId,
    volumeRange.range
  );
  const { data: followerGrowth } = useFollowerGrowth(
    organizationId,
    followersRange.range
  );
  const { data: topPosts } = useTopPosts(
    organizationId,
    undefined,
    topPostsRange.range
  );
  const { data: performance } = usePostingPerformance(
    organizationId,
    bestTimeRange.range
  );
  const { data: adoption } = useNotraAdoption(organizationId);

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(ANALYTICS_TAB_VALUES).withDefault("overview")
  );

  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const ready = !isOverviewPending;

  useEffect(() => {
    if (!ready) {
      setStage(0);
      return;
    }
    if (reduceMotion) {
      setStage(STAGE.modules);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(STAGE.rail), TIMING.readoutRail));
    timers.push(setTimeout(() => setStage(STAGE.modules), TIMING.modules));
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [ready, reduceMotion]);

  const accounts = useMemo(
    () => overview?.accounts ?? [],
    [overview?.accounts]
  );

  const accountConfig = useMemo(() => {
    const config: ChartConfig = {};
    accounts.forEach((account, index) => {
      config[accountSeriesKey(account.provider, account.providerAccountId)] = {
        label: `@${account.username}`,
        colors: accountSeriesColors(index),
      };
    });
    return config;
  }, [accounts]);

  const accountColors = useMemo(() => {
    const map = new Map<string, ChartColorPair>();
    accounts.forEach((account, index) => {
      map.set(
        accountSeriesKey(account.provider, account.providerAccountId),
        accountSeriesColorPair(index)
      );
    });
    return map;
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

  const visibleAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        selectedKeys.has(
          accountSeriesKey(account.provider, account.providerAccountId)
        )
      ),
    [accounts, selectedKeys]
  );

  const visiblePoints = useMemo(
    () =>
      (engagement?.points ?? []).filter((point) =>
        selectedKeys.has(
          accountSeriesKey(point.provider, point.providerAccountId)
        )
      ),
    [engagement?.points, selectedKeys]
  );

  const engagementTimeline = useMemo(
    () => buildTimelineRange(engagementRange.range),
    [engagementRange.range]
  );

  const impressionsTimeline = useMemo(
    () => buildTimelineRange(impressionsRange.range),
    [impressionsRange.range]
  );

  const volumeTimeline = useMemo(
    () => buildTimelineRange(volumeRange.range),
    [volumeRange.range]
  );

  const engagementRows = useMemo(
    () =>
      buildAccountSeriesRows(
        engagementTimeline,
        visibleKeys,
        engagement?.points ?? [],
        (point) =>
          (point.likes ?? 0) + (point.replies ?? 0) + (point.reposts ?? 0)
      ),
    [engagementTimeline, visibleKeys, engagement?.points]
  );

  const impressionRows = useMemo(
    () =>
      buildAccountSeriesRows(
        impressionsTimeline,
        visibleKeys,
        impressionSeries?.points ?? [],
        (point) => point.impressions ?? 0
      ),
    [impressionsTimeline, visibleKeys, impressionSeries?.points]
  );

  const postRows = useMemo(
    () =>
      buildAccountSeriesRows(
        volumeTimeline,
        visibleKeys,
        volumeSeries?.points ?? [],
        (point) => point.posts
      ),
    [volumeTimeline, visibleKeys, volumeSeries?.points]
  );

  const engagementMarkers = useMemo(
    () => buildAdoptionMarkers(engagementTimeline, adoption),
    [engagementTimeline, adoption]
  );

  const impressionsMarkers = useMemo(
    () => buildAdoptionMarkers(impressionsTimeline, adoption),
    [impressionsTimeline, adoption]
  );

  const volumeMarkers = useMemo(
    () => buildAdoptionMarkers(volumeTimeline, adoption),
    [volumeTimeline, adoption]
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
            <h1 className="font-bold text-3xl tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              How your X and LinkedIn accounts are performing
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
      <div className="w-full space-y-4 px-4 lg:px-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                How your X and LinkedIn accounts are performing
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
          <p className="rounded-md border border-border px-3 py-2 font-mono text-[0.6875rem] text-muted-foreground">
            Analytics ingestion is not configured yet. Connected accounts are
            shown, but stats will appear once the analytics backend is set up.
          </p>
        )}

        <InstrumentReveal active={stage >= STAGE.rail}>
          <SummaryStats
            accounts={visibleAccounts}
            points={visiblePoints}
            rangeHint={rangeHintLabel(engagementRange)}
          />
        </InstrumentReveal>

        <Tabs
          onValueChange={(value) =>
            setActiveTab(value === "leaderboard" ? "leaderboard" : "overview")
          }
          value={activeTab}
        >
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" keepMounted value="overview">
            <InstrumentGrid className="grid-cols-1 gap-4 lg:grid-cols-12">
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-8"
                order={0}
              >
                <AccountSeriesChartCard
                  action={<AnalyticsRangePicker control={engagementRange} />}
                  allKeys={allKeys}
                  config={accountConfig}
                  description="Likes, replies and reposts across your accounts"
                  emptyMessage="No engagement data for this time frame"
                  hero
                  hiddenKeys={hiddenKeys}
                  kind="area"
                  markers={engagementMarkers}
                  markIncompleteTail={engagementRange.includesToday}
                  onToggleSeries={toggleAccount}
                  rows={engagementRows}
                  title="Engagement"
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-4"
                order={1}
              >
                <FollowersCard
                  accounts={accounts}
                  action={<AnalyticsRangePicker control={followersRange} />}
                  colorForKey={(key) =>
                    accountColors.get(key) ?? CHART_MUTED_COLOR
                  }
                  hiddenKeys={hiddenKeys}
                  markIncompleteTail={followersRange.includesToday}
                  points={followerGrowth?.points ?? []}
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-4"
                order={2}
              >
                <ImpressionsShareCard
                  colorForKey={(key) =>
                    accountColors.get(key) ?? CHART_MUTED_COLOR
                  }
                  organizationId={organizationId}
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-8"
                order={4}
              >
                <AccountSeriesChartCard
                  action={<AnalyticsRangePicker control={impressionsRange} />}
                  allKeys={allKeys}
                  config={accountConfig}
                  emptyMessage="No impression data for this time frame"
                  hiddenKeys={hiddenKeys}
                  kind="area"
                  markers={impressionsMarkers}
                  markIncompleteTail={impressionsRange.includesToday}
                  onToggleSeries={toggleAccount}
                  rows={impressionRows}
                  title="Impressions"
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-6"
                order={5}
              >
                <AccountSeriesChartCard
                  action={<AnalyticsRangePicker control={volumeRange} />}
                  allKeys={allKeys}
                  config={accountConfig}
                  emptyMessage="No posts for this time frame"
                  hiddenKeys={hiddenKeys}
                  kind="bar"
                  markers={volumeMarkers}
                  markIncompleteTail={volumeRange.includesToday}
                  onToggleSeries={toggleAccount}
                  rows={postRows}
                  title="Publishing volume"
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-6"
                order={6}
              >
                <PostingPerformanceCard
                  action={<AnalyticsRangePicker control={bestTimeRange} />}
                  points={performance?.points ?? []}
                />
              </InstrumentReveal>
              <InstrumentReveal
                active={stage >= STAGE.modules}
                className="lg:col-span-12"
                order={7}
              >
                <TopPostsCard
                  action={<AnalyticsRangePicker control={topPostsRange} />}
                  posts={topPosts?.posts ?? []}
                />
              </InstrumentReveal>
            </InstrumentGrid>
          </TabsContent>

          <TabsContent className="mt-6" keepMounted value="leaderboard">
            <LeaderboardCard
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              variant="page"
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
