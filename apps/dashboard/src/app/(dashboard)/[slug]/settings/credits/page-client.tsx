"use client";

import { Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import { FEATURES } from "@notra/ai/billing/features";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { useAggregateEvents } from "autumn-js/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CreditActivity } from "@/components/billing/credit-activity";
import { CreditSummaryCards } from "@/components/billing/credit-summary-cards";
import { CreditTopupModal } from "@/components/billing/credit-topup-modal";
import { CreditUsageChart } from "@/components/billing/credit-usage-chart";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { NotFoundContent } from "@/components/not-found-content";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";
import { useHasAiCreditsFeature } from "@/lib/hooks/use-plan";
import type { CreditRangeOption } from "@/types/billing/credits";

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
  const totalUsage =
    typeof total?.[FEATURES.AI_CREDITS]?.sum === "number"
      ? (total[FEATURES.AI_CREDITS]?.sum ?? 0)
      : 0;

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
        <CreditSummaryCards
          customer={customer}
          isLoading={customerLoading}
          totalUsage={totalUsage}
          range={range}
        />
        <CreditUsageChart
          data={aggregatedList}
          range={range}
          onRangeChange={setRange}
        />
        <CreditActivity />
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
