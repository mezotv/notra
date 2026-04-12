"use client";

import { Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { Button } from "@notra/ui/components/ui/button";
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
import {
  useAggregateEvents,
  useAutumnClient,
  useCustomer,
} from "autumn-js/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { PageContainer } from "@/components/layout/container";
import { FEATURES } from "@/constants/features";
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
  isCreditRange,
  usageBarColor,
} from "@/utils/format";
import { getOutputTypeLabel } from "@/utils/output-types";

const chartConfig = {
  ai_credits: {
    label: "Credits Used",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function renderEventRows(events: ListEventsRow[] | undefined) {
  if (!events?.length) {
    return (
      <TableRow>
        <TableCell
          className="h-24 text-center text-muted-foreground"
          colSpan={3}
        >
          No usage events yet
        </TableCell>
      </TableRow>
    );
  }

  return events.map((event) => {
    const outputType =
      "output_type" in event.properties &&
      typeof event.properties.output_type === "string"
        ? event.properties.output_type
        : undefined;

    return (
      <TableRow key={event.id}>
        <TableCell className="text-muted-foreground text-sm">
          {formatFullDate(event.timestamp)}
        </TableCell>
        <TableCell className="text-sm">
          {outputType ? getOutputTypeLabel(outputType) : "—"}
        </TableCell>
        <TableCell className="text-right font-medium text-sm tabular-nums">
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

  const { data: customer, isLoading: customerLoading } = useCustomer({
    expand: ["balances.feature"],
  });

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
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: [
      "autumn",
      "events",
      "list",
      FEATURES.AI_CREDITS,
      eventsOffset,
      eventsLimit,
    ],
    queryFn: () =>
      autumnClient.listEvents({
        featureId: FEATURES.AI_CREDITS,
        offset: eventsOffset,
        limit: eventsLimit,
      }),
  });

  const hasMore = eventsData?.hasMore ?? false;
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

  if (success) {
    return (
      <PageContainer className="flex flex-1 flex-col items-center justify-center">
        <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
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
          <HugeiconsIcon
            className="size-12 text-emerald-500"
            icon={Tick02Icon}
          />
          <div className="space-y-1">
            <h2 className="font-bold text-2xl">Credits Added!</h2>
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
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Credits</h1>
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
                <p className="font-bold text-3xl tabular-nums tracking-tight">
                  {aiCreditsBalance !== null
                    ? formatDollars(aiCreditsBalance)
                    : "-"}
                </p>
                {aiCreditsIncluded !== null && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    of {formatDollars(aiCreditsIncluded)} included
                  </p>
                )}
              </div>
            </TitleCard>

            <TitleCard accentColor="#8b5cf6" heading="Used This Period">
              <div>
                <p className="font-bold text-3xl tabular-nums tracking-tight">
                  {formatDollars(totalUsage)}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  in the last {CREDIT_RANGE_LABELS[range]}
                </p>
              </div>
            </TitleCard>

            <TitleCard heading="Usage">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-3xl tabular-nums tracking-tight">
                    {Math.round(usagePercent)}%
                  </p>
                  <p className="text-muted-foreground text-sm">of plan</p>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      usagePercent > 90
                        ? "bg-red-500"
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
            <h2 className="font-semibold text-lg">Usage</h2>
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
              <div className="flex h-[240px] items-center justify-center text-muted-foreground text-sm">
                No usage data for this period
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          <div className="overflow-hidden rounded-xl border">
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
