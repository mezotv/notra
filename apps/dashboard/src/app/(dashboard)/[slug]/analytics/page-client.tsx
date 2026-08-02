"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccountFilter } from "@/components/analytics/account-filter";
import { AccountSeriesChartCard } from "@/components/analytics/account-series-chart-card";
import { ConnectAccountsButtons } from "@/components/analytics/connect-accounts-buttons";
import { FollowersCard } from "@/components/analytics/followers-card";
import { ImpressionsShareCard } from "@/components/analytics/impressions-share-card";
import { LeaderboardCard } from "@/components/analytics/leaderboard-card";
import { PostingPerformanceCard } from "@/components/analytics/posting-performance-card";
import { SummaryStats } from "@/components/analytics/summary-stats";
import { TopPostsCard } from "@/components/analytics/top-posts-card";
import { EmptyState } from "@/components/empty-state";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { PageContainer } from "@/components/layout/container";
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
import { cn } from "@/lib/utils";
import type { TimelineMarker } from "@/types/analytics";
import {
  accountSeriesKey,
  buildAccountSeriesRows,
  buildPostingPerformanceRows,
  buildTimelineDays,
  markerIndexForDate,
} from "@/utils/analytics-charts";
import { formatSyncClock } from "@/utils/instrument";
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

  const {
    data: overview,
    isPending: isOverviewPending,
    dataUpdatedAt,
  } = useSocialOverview(organizationId);
  const { data: engagement } = useEngagementTimeseries(organizationId);
  const { data: followerGrowth } = useFollowerGrowth(organizationId);
  const { data: topPosts } = useTopPosts(organizationId);
  const { data: performance } = usePostingPerformance(organizationId);
  const { data: adoption } = useNotraAdoption(organizationId);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

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
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
              X + LinkedIn instrument panel
            </p>
            <h1 className="font-semibold text-xl tracking-tight">
              Nothing to report yet.
            </h1>
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-semibold text-xl tracking-tight">
                Analytics
              </h1>
              <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
                <span>
                  {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"} · X +
                  LinkedIn · {ANALYTICS_TIMESERIES_DAYS}D window · Sync{" "}
                  {formatSyncClock(dataUpdatedAt || null)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full bg-emerald-500",
                    stage >= STAGE.rail &&
                      "animate-pulse motion-reduce:animate-none"
                  )}
                />
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
          <SummaryStats accounts={accounts} points={engagement?.points ?? []} />
        </InstrumentReveal>

        <InstrumentGrid className="grid-cols-1 lg:grid-cols-12">
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={0}
          >
            <AccountSeriesChartCard
              allKeys={allKeys}
              config={accountConfig}
              emptyMessage="No engagement data yet"
              hero
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="area"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              readout={`${ANALYTICS_TIMESERIES_DAYS}D`}
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
              colorForKey={(key) => accountConfig[key]?.color ?? "blue"}
              hiddenKeys={hiddenKeys}
              points={followerGrowth?.points ?? []}
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={2}
          >
            <LeaderboardCard
              accountDetails={accounts}
              organizationId={organizationId}
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-4"
            order={3}
          >
            <ImpressionsShareCard organizationId={organizationId} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-6"
            order={4}
          >
            <AccountSeriesChartCard
              allKeys={allKeys}
              config={accountConfig}
              emptyMessage="No impression data yet"
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="area"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              readout={`${ANALYTICS_TIMESERIES_DAYS}D`}
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
              allKeys={allKeys}
              config={accountConfig}
              emptyMessage="No posts tracked yet"
              hiddenKeys={hiddenKeys}
              hoverIndex={hoverIndex}
              kind="bar"
              markers={markers}
              onHoverChange={setHoverIndex}
              onToggleSeries={toggleAccount}
              readout={`${ANALYTICS_TIMESERIES_DAYS}D`}
              rows={postRows}
              title="Publishing volume"
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-6"
            order={6}
          >
            <PostingPerformanceCard rows={performanceRows} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-6"
            order={7}
          >
            <TopPostsCard posts={topPosts?.posts ?? []} />
          </InstrumentReveal>
        </InstrumentGrid>
      </div>
    </PageContainer>
  );
}
