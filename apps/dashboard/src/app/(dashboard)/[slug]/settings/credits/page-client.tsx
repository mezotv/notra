"use client";

import { Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { FEATURES } from "@notra/ai/billing/features";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import type { ChartConfig } from "@notra/ui/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@notra/ui/components/ui/chart";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@notra/ui/components/ui/pagination";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { cn } from "@notra/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAggregateEvents, useAutumnClient } from "autumn-js/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { NotFoundContent } from "@/components/not-found-content";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { authClient } from "@/lib/auth/client";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";
import { useHasAiCreditsFeature } from "@/lib/hooks/use-plan";
import {
  CREDIT_RANGE_LABELS,
  CREDIT_RANGES,
  type CreditRangeOption,
  type ListEventsRow,
} from "@/types/billing/credits";
import {
  formatDollars,
  formatFullDate,
  formatShortDate,
  formatSnakeCaseLabel,
  isCreditRange,
  usageBarColor,
} from "@/utils/format";
import { getOutputTypeLabel } from "@/utils/output-types";
import { hasMorePaginatedResults } from "@/utils/pagination";

const chartConfig = {
  ai_credits: {
    label: "Credits Used",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function getCreditEventLabel(event: ListEventsRow) {
  const properties =
    typeof event.properties === "object" && event.properties !== null
      ? event.properties
      : null;

  const outputType =
    properties &&
    "output_type" in properties &&
    typeof properties.output_type === "string"
      ? properties.output_type
      : undefined;

  if (outputType) {
    return getOutputTypeLabel(outputType);
  }

  const source =
    properties &&
    "source" in properties &&
    typeof properties.source === "string"
      ? properties.source
      : undefined;

  if (source === "standalone_chat" || source === "chat") {
    return "AI Chat";
  }

  return source ? formatSnakeCaseLabel(source) : "—";
}

function renderEventRows(events: ListEventsRow[] | undefined) {
  if (!events?.length) {
    return (
      <TableRow>
        <TableCell
          className="text-muted-foreground h-24 text-center"
          colSpan={3}
        >
          No usage events yet
        </TableCell>
      </TableRow>
    );
  }

  return events.map((event) => {
    return (
      <TableRow key={event.id}>
        <TableCell className="text-muted-foreground text-sm">
          {formatFullDate(event.timestamp)}
        </TableCell>
        <TableCell className="text-sm">{getCreditEventLabel(event)}</TableCell>
        <TableCell className="text-right text-sm font-medium tabular-nums">
          {formatDollars(event.value)}
        </TableCell>
      </TableRow>
    );
  });
}

export default function CreditsPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [range, setRange] = useState<CreditRangeOption>("30d");
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const successTrackedRef = useRef(false);

  useEffect(() => {
    if (!success || successTrackedRef.current) {
      return;
    }
    successTrackedRef.current = true;
    trackEvent(POSTHOG_EVENTS.CREDITS_TOPUP_COMPLETED, {
      amount_dollars: null,
      is_preset: null,
      via_checkout: true,
    });
  }, [success]);

  const { data: customer, isLoading: customerLoading } = useBillingCustomer({
    expand: ["balances.feature"],
  });
  const { hasAiCredits, isLoading: aiCreditsLoading } =
    useHasAiCreditsFeature();

  const { list: aggregatedList, total } = useAggregateEvents({
    featureId: FEATURES.AI_CREDITS,
    range,
    binSize: "day",
  });

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );
  const eventsLimit = 20;
  const eventsOffset = Math.max(0, page - 1) * eventsLimit;
  const autumnClient = useAutumnClient({ caller: "CreditsPageClient" });
  const { activeOrganization } = useOrganizationsContext();
  const { data: session } = authClient.useSession();
  const sessionMatchesOrganization =
    Boolean(activeOrganization?.id) &&
    session?.session.activeOrganizationId === activeOrganization?.id;
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: [
      "autumn",
      "events",
      "list",
      activeOrganization?.id,
      FEATURES.AI_CREDITS,
      eventsOffset,
      eventsLimit,
    ],
    queryFn: () => {
      const params = {
        featureId: FEATURES.AI_CREDITS,
        offset: eventsOffset,
        limit: eventsLimit,
      };
      return autumnClient.listEvents(params);
    },
    enabled: sessionMatchesOrganization,
  });

  const hasMore = hasMorePaginatedResults(eventsData, eventsLimit);
  const hasPrevious = page > 1;

  const visibleEvents = useMemo(
    () => eventsData?.list.filter((event) => event.value !== 0),
    [eventsData]
  );

  const aiCredits = customer?.balances?.[FEATURES.AI_CREDITS];
  const aiCreditsBalance =
    typeof aiCredits?.remaining === "number" ? aiCredits.remaining : null;
  const aiCreditsIncluded =
    typeof aiCredits?.granted === "number" ? aiCredits.granted : null;

  const totalUsage =
    typeof total?.[FEATURES.AI_CREDITS]?.sum === "number"
      ? (total[FEATURES.AI_CREDITS]?.sum ?? 0)
      : 0;

  const usagePercent =
    aiCreditsIncluded && aiCreditsIncluded > 0
      ? Math.min(
          ((aiCreditsIncluded - (aiCreditsBalance ?? 0)) / aiCreditsIncluded) *
            100,
          100
        )
      : 0;

  const chartData = useMemo(() => {
    if (!aggregatedList?.length) {
      return [];
    }
    return aggregatedList.map((row) => {
      const value = row.values?.[FEATURES.AI_CREDITS];
      return {
        date: row.period,
        ai_credits: typeof value === "number" ? value : 0,
      };
    });
  }, [aggregatedList]);

  if (!(aiCreditsLoading || hasAiCredits)) {
    return (
      <PageContainer className="flex flex-1 flex-col">
        <NotFoundContent className="flex-1" />
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer className="flex flex-1 flex-col items-center justify-center">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2">
          <Confetti
            colors={[
              "var(--primary)",
              "#FFC700",
              "#FF6B6B",
              "#41BBC7",
              "#A78BFA",
              "#34D399",
            ]}
            duration={3000}
            force={0.5}
            particleCount={120}
            particleShape="mix"
            particleSize={8}
            stageHeight={600}
            stageWidth={800}
          />
        </div>
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <HugeiconsIcon className="text-success size-12" icon={Tick02Icon} />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Credits Added!</h2>
            <p className="text-muted-foreground">
              Your AI credits have been topped up and are ready to use.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href={`/${slug}`} />}>
            Go to dashboard
          </Button>
        </div>
      </PageContainer>
    );
  }

  const isLoading = customerLoading;

  return (
    <PageContainer
      className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6"
      variant="default"
    >
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
            <p className="text-muted-foreground">
              Monitor your AI credit balance and usage
            </p>
          </div>
          <Button
            className="gap-2 self-start"
            onClick={() => setTopupOpen(true)}
          >
            <HugeiconsIcon className="size-4" icon={Add01Icon} />
            Top Up Credits
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <TitleCard accentColor="#10b981" heading="Current Balance">
              <div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {aiCreditsBalance !== null
                    ? formatDollars(aiCreditsBalance)
                    : "-"}
                </p>
                {aiCreditsIncluded !== null && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    of {formatDollars(aiCreditsIncluded)} included
                  </p>
                )}
              </div>
            </TitleCard>

            <TitleCard accentColor="#8b5cf6" heading="Used This Period">
              <div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {formatDollars(totalUsage)}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  in the last {CREDIT_RANGE_LABELS[range]}
                </p>
              </div>
            </TitleCard>

            <TitleCard heading="Usage">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {Math.round(usagePercent)}%
                  </p>
                  <p className="text-muted-foreground text-sm">of plan</p>
                </div>
                <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "duration-slower h-full rounded-full transition-all",
                      usagePercent > 90
                        ? "bg-destructive"
                        : usageBarColor(usagePercent)
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </TitleCard>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Usage</h2>
            <Tabs
              onValueChange={(value) => {
                if (isCreditRange(value, CREDIT_RANGES)) {
                  setRange(value);
                }
              }}
              value={range}
            >
              <TabsList variant="line">
                {CREDIT_RANGES.map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {value.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="rounded-xl border p-4">
            {chartData.length > 0 ? (
              <ChartContainer
                className="aspect-auto h-[240px] w-full"
                config={chartConfig}
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    className="stroke-border/20"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    className="text-muted-foreground/60 text-xs"
                    dataKey="date"
                    minTickGap={32}
                    tickFormatter={(value: number) => formatShortDate(value)}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    className="text-muted-foreground/60 text-xs"
                    tickFormatter={(value: number) => formatDollars(value)}
                    tickLine={false}
                    tickMargin={8}
                    width={48}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatDollars(Number(value))}
                        labelFormatter={(_, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.date ? formatShortDate(item.date) : "";
                        }}
                      />
                    }
                    cursor={false}
                  />
                  <Bar
                    dataKey="ai_credits"
                    fill="var(--color-ai_credits)"
                    opacity={0.8}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground flex h-[240px] items-center justify-center text-sm">
                No usage data for this period
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i.toString()}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  : renderEventRows(visibleEvents)}
              </TableBody>
            </Table>
          </div>
          {(hasPrevious || hasMore) && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={cn(
                      !hasPrevious && "pointer-events-none opacity-50"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasPrevious) {
                        setPage(Math.max(1, page - 1));
                      }
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    className={cn(!hasMore && "pointer-events-none opacity-50")}
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasMore) {
                        setPage(page + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      <CreditTopupModal
        onOpenChange={(open) => {
          setTopupOpen(open);
          if (!open) {
            setTopupSuccess(false);
          }
        }}
        onSuccess={() => setTopupSuccess(true)}
        open={topupOpen}
        success={topupSuccess}
      />
    </PageContainer>
  );
}
