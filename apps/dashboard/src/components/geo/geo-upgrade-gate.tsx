"use client";

import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { GeoUpgradeDialog } from "@/components/billing/geo-upgrade-dialog";
import { EmptyStateAnalyticsPreview } from "@/components/empty-state-preview";
import { PageContainer } from "@/components/layout/container";
import { GEO_LOCKED_TITLE, GEO_UPGRADE_DESCRIPTION } from "@/constants/geo";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import type { GeoUpgradeGateProps } from "@/types/components/geo";

export function GeoUpgradeGate({ slug, children }: GeoUpgradeGateProps) {
  const router = useRouter();
  const { isLocked, isLoading } = useHasGeoFeature();

  if (isLoading) {
    return null;
  }

  if (!isLocked) {
    return children;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="relative w-full overflow-hidden rounded-2xl px-4 lg:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 select-none px-3 pt-3 sm:px-4 sm:pt-4"
        >
          <div className="mask-[linear-gradient(to_bottom,black_0%,transparent_100%)] opacity-[0.38]">
            <EmptyStateAnalyticsPreview />
          </div>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-16 pb-8 text-center">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={SquareLock02Icon}
          />
          <h2 className="mt-3 text-balance font-semibold text-lg">
            {GEO_LOCKED_TITLE}
          </h2>
          <p className="mt-1.5 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
            {GEO_UPGRADE_DESCRIPTION}
          </p>
        </div>
      </div>
      <GeoUpgradeDialog
        onOpenChange={(open) => {
          if (!open) {
            router.push(`/${slug}`);
          }
        }}
        open
        slug={slug}
      />
    </PageContainer>
  );
}
