"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FEATURES } from "@notra/ai/billing/features";
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
import { useAggregateEvents } from "autumn-js/react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  IntegrationCardDither,
  useIntegrationCardDither,
} from "@/components/integrations/integration-card-dither";
import {
  USAGE_FEATURE_SKELETON_KEYS,
  USAGE_METRIC_SKELETON_KEYS,
} from "@/constants/billing";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";
import type {
  FeatureData,
  UsageLimitedFeatureRowProps,
  UsageRangeOption,
  UsageSectionBodyProps,
} from "@/types/hooks/billing";

const ranges = ["7d", "30d", "90d", "last_cycle"] as const;

const RANGE_LABELS: Record<UsageRangeOption, string> = {
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

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatFeatureName(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function UsageMetricCard({
  accentColor,
  heading,
  children,
}: {
  accentColor: string;
  heading: string;
  children: ReactNode;
}) {
  const dither = useIntegrationCardDither();

  return (
    <TitleCard
      {...dither.interactionProps}
      accentColor={accentColor}
      heading={heading}
      hoverBackground={
        <IntegrationCardDither active={dither.active} color={accentColor} />
      }
    >
      {children}
    </TitleCard>
  );
}

function UsageSectionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
          <p className="text-muted-foreground text-sm">
            Track your feature usage and remaining balances
          </p>
        </div>
        <Skeleton className="h-8 w-64 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {USAGE_METRIC_SKELETON_KEYS.map((key) => (
          <TitleCard heading={<Skeleton className="h-5 w-32" />} key={key}>
            <Skeleton className="h-8 w-24" />
          </TitleCard>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="divide-y rounded-xl border">
          {USAGE_FEATURE_SKELETON_KEYS.map((key) => (
            <div
              className="flex items-center justify-between gap-4 p-4"
              key={key}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageLimitedFeatureRow({
  feature,
  range,
}: UsageLimitedFeatureRowProps) {
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
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{feature.name}</p>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground inline-flex cursor-help">
              <HugeiconsIcon
                className="size-3.5"
                icon={InformationCircleIcon}
              />
            </TooltipTrigger>
            <TooltipContent>
              {Math.round(percent)}% of your {feature.name.toLowerCase()} limit
              is used ({RANGE_LABELS[range]}).
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{descriptionText}</p>
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
                <span className="text-muted-foreground">Feature</span>
                <span>{feature.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Used</span>
                <span>{formatNumber(used)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span>
                  {feature.balance !== null
                    ? formatNumber(feature.balance)
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Included</span>
                <span>{formatNumber(feature.included ?? 0)}</span>
              </div>
            </ContextContentBody>
          </ContextContent>
        </Context>
      </div>
    </div>
  );
}

function UsageRetentionRow({ retentionDays }: { retentionDays: number }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">Log Retention</p>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground inline-flex cursor-help">
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
        <p className="text-muted-foreground mt-1 text-xs">
          Your current retention window is {retentionDays} days.
        </p>
      </div>
      <div className="border-border bg-muted shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">
        {retentionDays} days
      </div>
    </div>
  );
}

function UsageUnlimitedFeatureRow({ feature }: { feature: FeatureData }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{feature.name}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Included in your plan without a usage cap
        </p>
      </div>
      <div className="border-border bg-muted shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">
        Unlimited
      </div>
    </div>
  );
}

function isLogRetentionFeature(feature: FeatureData) {
  return (
    feature.id === FEATURES.LOG_RETENTION_7_DAYS ||
    feature.id === FEATURES.LOG_RETENTION_14_DAYS ||
    feature.id === FEATURES.LOG_RETENTION_30_DAYS
  );
}

function featuresFromBalances(
  balances:
    | Record<
        string,
        {
          remaining?: number | null;
          granted?: number | null;
          unlimited?: boolean;
          feature?: { name?: string | null } | null;
        } | null
      >
    | null
    | undefined
): FeatureData[] {
  if (!balances) {
    return [];
  }
  const features: FeatureData[] = [];
  for (const [id, feature] of Object.entries(balances)) {
    const balance =
      typeof feature?.remaining === "number" ? feature.remaining : null;
    const included =
      typeof feature?.granted === "number" ? feature.granted : null;
    features.push({
      id,
      name: feature?.feature?.name ?? formatFeatureName(id),
      balance,
      included,
      unlimited: feature?.unlimited === true,
    });
  }
  return features;
}

function usageRetentionDays(features: readonly FeatureData[]): number {
  const logRetention30DaysFeature = features.find(
    (feature) => feature.id === FEATURES.LOG_RETENTION_30_DAYS
  );
  const logRetention14DaysFeature = features.find(
    (feature) => feature.id === FEATURES.LOG_RETENTION_14_DAYS
  );
  const has30DayRetention =
    logRetention30DaysFeature?.unlimited === true ||
    (logRetention30DaysFeature?.included ?? 0) > 0 ||
    (logRetention30DaysFeature?.balance ?? 0) > 0;
  const has14DayRetention =
    logRetention14DaysFeature?.unlimited === true ||
    (logRetention14DaysFeature?.included ?? 0) > 0 ||
    (logRetention14DaysFeature?.balance ?? 0) > 0;
  if (has30DayRetention) {
    return 30;
  }
  if (has14DayRetention) {
    return 14;
  }
  return 7;
}

export function UsageSection() {
  const [range, setRange] = useState<UsageRangeOption>("30d");
  const { data: customer, isLoading: customerLoading } = useBillingCustomer({
    expand: ["balances.feature"],
  });

  const { total } = useAggregateEvents({
    featureId: FEATURES.AI_CREDITS,
    range,
    binSize: "day",
  });

  const totalUsage =
    typeof total?.[FEATURES.AI_CREDITS]?.sum === "number"
      ? (total?.[FEATURES.AI_CREDITS]?.sum ?? 0)
      : 0;

  if (customerLoading && !customer) {
    return <UsageSectionSkeleton />;
  }

  const features = featuresFromBalances(customer?.balances);
  const limitedFeatures = features.filter(
    (feature) =>
      !feature.unlimited &&
      feature.included !== null &&
      !isLogRetentionFeature(feature)
  );
  const unlimitedFeatures = features.filter(
    (feature) => feature.unlimited && !isLogRetentionFeature(feature)
  );
  const aiCreditsFeature = features.find(
    (feature) => feature.id === FEATURES.AI_CREDITS
  );
  const hasRetentionFeature = features.some(isLogRetentionFeature);
  const retentionDays = usageRetentionDays(features);

  return (
    <UsageSectionBody
      aiCreditsFeature={aiCreditsFeature}
      hasRetentionFeature={hasRetentionFeature}
      limitedFeatures={limitedFeatures}
      onRangeChange={setRange}
      range={range}
      retentionDays={retentionDays}
      totalUsage={totalUsage}
      unlimitedFeatures={unlimitedFeatures}
    />
  );
}

function UsageSectionBody({
  aiCreditsFeature,
  hasRetentionFeature,
  limitedFeatures,
  onRangeChange,
  range,
  retentionDays,
  totalUsage,
  unlimitedFeatures,
}: UsageSectionBodyProps) {
  const showFeatures =
    limitedFeatures.length > 0 ||
    hasRetentionFeature ||
    unlimitedFeatures.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
          <p className="text-muted-foreground text-sm">
            Track your feature usage and remaining balances
          </p>
        </div>
        <Tabs
          onValueChange={(value) => onRangeChange(value as UsageRangeOption)}
          value={range}
        >
          <TabsList aria-label="Usage range">
            {ranges.map((value) => (
              <TabsTrigger key={value} value={value}>
                {value === "last_cycle" ? "Last cycle" : value.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {aiCreditsFeature ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageMetricCard accentColor="#8b5cf6" heading="Credits Used">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {formatDollars(totalUsage)}
              </p>
              <p className="text-muted-foreground text-sm">
                in selected period
              </p>
            </div>
          </UsageMetricCard>
          <UsageMetricCard accentColor="#10b981" heading="Credits Remaining">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {aiCreditsFeature.balance !== null
                  ? formatDollars(aiCreditsFeature.balance)
                  : "-"}
              </p>
              <p className="text-muted-foreground text-sm">
                {aiCreditsFeature.included
                  ? `of ${formatDollars(aiCreditsFeature.included)}`
                  : "available"}
              </p>
            </div>
          </UsageMetricCard>
        </div>
      ) : null}

      {showFeatures ? (
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Features
          </h2>
          <div className="divide-y rounded-xl border">
            {limitedFeatures.map((feature) => (
              <UsageLimitedFeatureRow
                feature={feature}
                key={feature.id}
                range={range}
              />
            ))}
            {hasRetentionFeature ? (
              <UsageRetentionRow retentionDays={retentionDays} />
            ) : null}
            {unlimitedFeatures.map((feature) => (
              <UsageUnlimitedFeatureRow feature={feature} key={feature.id} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
