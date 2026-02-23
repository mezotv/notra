"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
} from "@notra/ui/components/ai-elements/context";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useAggregateEvents, useCustomer } from "autumn-js/react";
import { useMemo, useState } from "react";
import { FEATURES } from "@/utils/constants";

const ranges = ["7d", "30d", "90d", "last_cycle"] as const;
type RangeOption = (typeof ranges)[number];

const RANGE_LABELS: Record<RangeOption, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  last_cycle: "last cycle",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFeatureName(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

interface FeatureData {
  id: string;
  name: string;
  balance: number | null;
  included: number | null;
  unlimited: boolean;
}

function isLogRetentionFeature(feature: FeatureData) {
  return (
    feature.id === FEATURES.LOG_RETENTION_7_DAYS ||
    feature.id === FEATURES.LOG_RETENTION_30_DAYS
  );
}

export function UsageSection() {
  const [range, setRange] = useState<RangeOption>("30d");
  const { customer, isLoading: customerLoading } = useCustomer();

  const { total } = useAggregateEvents({
    featureId: FEATURES.AI_CREDITS,
    range,
    binSize: "day",
  });

  const totalUsage =
    typeof total?.[FEATURES.AI_CREDITS]?.sum === "number"
      ? (total?.[FEATURES.AI_CREDITS]?.sum ?? 0)
      : 0;

  const features = useMemo<FeatureData[]>(() => {
    if (!customer?.features) {
      return [];
    }

    return Object.entries(customer.features).map(([id, feature]) => {
      const balance =
        typeof feature?.balance === "number" ? feature.balance : null;
      const included =
        typeof feature?.included_usage === "number"
          ? feature.included_usage
          : null;

      return {
        id,
        name: formatFeatureName(id),
        balance,
        included,
        unlimited: feature?.unlimited === true,
      };
    });
  }, [customer?.features]);

  const limitedFeatures = features.filter(
    (feature) =>
      !feature.unlimited &&
      feature.included !== null &&
      !isLogRetentionFeature(feature)
  );
  const unlimitedFeatures = features.filter((feature) => feature.unlimited);
  const aiCreditsFeature = features.find(
    (feature) => feature.id === FEATURES.AI_CREDITS
  );

  const logRetention7DaysFeature = features.find(
    (feature) => feature.id === FEATURES.LOG_RETENTION_7_DAYS
  );
  const logRetention30DaysFeature = features.find(
    (feature) => feature.id === FEATURES.LOG_RETENTION_30_DAYS
  );
  const has30DayRetention =
    logRetention30DaysFeature?.unlimited === true ||
    (logRetention30DaysFeature?.included ?? 0) > 0 ||
    (logRetention30DaysFeature?.balance ?? 0) > 0;
  const hasRetentionFeature =
    logRetention7DaysFeature !== undefined ||
    logRetention30DaysFeature !== undefined;
  const retentionDays = has30DayRetention ? 30 : 7;

  if (customerLoading && !customer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg tracking-tight">Usage</h2>
          <p className="text-muted-foreground text-sm">
            Track your feature usage and remaining balances
          </p>
        </div>
        <Tabs
          onValueChange={(value) => setRange(value as RangeOption)}
          value={range}
        >
          <TabsList variant="line">
            {ranges.map((value) => (
              <TabsTrigger key={value} value={value}>
                {value === "last_cycle" ? "Last cycle" : value.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {aiCreditsFeature && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TitleCard accentColor="#8b5cf6" heading="Credits Used">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-3xl tabular-nums tracking-tight">
                {formatNumber(totalUsage)}
              </p>
              <p className="text-muted-foreground text-sm">
                in selected period
              </p>
            </div>
          </TitleCard>
          <TitleCard accentColor="#10b981" heading="Credits Remaining">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-3xl tabular-nums tracking-tight">
                {aiCreditsFeature.balance !== null
                  ? formatNumber(aiCreditsFeature.balance)
                  : "-"}
              </p>
              <p className="text-muted-foreground text-sm">
                {aiCreditsFeature.included
                  ? `of ${formatNumber(aiCreditsFeature.included)}`
                  : "available"}
              </p>
            </div>
          </TitleCard>
        </div>
      )}

      {(limitedFeatures.length > 0 || hasRetentionFeature) && (
        <div className="space-y-4">
          <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
            Limits
          </h2>
          <div className="divide-y rounded-xl border">
            {limitedFeatures.map((feature) => {
              const used =
                feature.included !== null && feature.balance !== null
                  ? feature.included - feature.balance
                  : 0;
              const percent =
                feature.included && feature.included > 0
                  ? Math.min((used / feature.included) * 100, 100)
                  : 0;
              const descriptionText =
                feature.balance !== null
                  ? `${formatNumber(feature.balance)} of ${formatNumber(feature.included ?? 0)} remaining`
                  : `of ${formatNumber(feature.included ?? 0)}`;

              return (
                <div
                  className="flex items-center justify-between gap-4 p-4"
                  key={feature.id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-sm">
                        {feature.name}
                      </p>
                      <Tooltip>
                        <TooltipTrigger className="inline-flex cursor-help text-muted-foreground">
                          <HugeiconsIcon
                            className="size-3.5"
                            icon={InformationCircleIcon}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {Math.round(percent)}% of your{" "}
                          {feature.name.toLowerCase()} limit is used (
                          {RANGE_LABELS[range]}).
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {descriptionText}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Context
                      maxTokens={Math.max(feature.included ?? 0, 1)}
                      usedTokens={used}
                    >
                      <ContextTrigger className="h-8 px-2" />
                      <ContextContent align="end" className="w-72">
                        <ContextContentHeader />
                        <ContextContentBody className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Feature
                            </span>
                            <span>{feature.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Used</span>
                            <span>{formatNumber(used)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Remaining
                            </span>
                            <span>
                              {feature.balance !== null
                                ? formatNumber(feature.balance)
                                : "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Included
                            </span>
                            <span>{formatNumber(feature.included ?? 0)}</span>
                          </div>
                        </ContextContentBody>
                      </ContextContent>
                    </Context>
                  </div>
                </div>
              );
            })}

            {hasRetentionFeature && (
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-sm">
                      Log Retention
                    </p>
                    <Tooltip>
                      <TooltipTrigger className="inline-flex cursor-help text-muted-foreground">
                        <HugeiconsIcon
                          className="size-3.5"
                          icon={InformationCircleIcon}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Determines how long logs are stored for your workspace.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Your current retention window is {retentionDays} days.
                  </p>
                </div>
                <div className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-medium text-xs">
                  {retentionDays} days
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {unlimitedFeatures.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
            Unlimited Features
          </h2>
          <div className="flex flex-wrap gap-2">
            {unlimitedFeatures.map((feature) => (
              <div
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                key={feature.id}
              >
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-sm">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
