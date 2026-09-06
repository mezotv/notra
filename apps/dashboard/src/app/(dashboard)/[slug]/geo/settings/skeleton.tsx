"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";

import { PageContainer } from "@/components/layout/container";
import type { GeoSettingsSkeletonSectionProps } from "@/types/geo";

const PROVIDER_ROW_COUNT = 3;
const TAG_WIDTHS = ["w-20", "w-24", "w-16"] as const;
const LANGUAGE_WIDTHS = ["w-24", "w-20", "w-28", "w-16"] as const;

function SettingsSectionSkeleton({
  title,
  description,
  children,
}: GeoSettingsSkeletonSectionProps) {
  return (
    <TitleCard as="section" heading={title} headingAs="h2">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm text-pretty">
          {description}
        </p>
        {children}
      </div>
    </TitleCard>
  );
}

export function GeoSettingsSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">GEO Settings</h1>
          <p className="text-muted-foreground">
            How your brand is identified and where prompts are scanned.
          </p>
        </header>
        <div className="space-y-6">
          <TitleCard as="section" heading="Brand" headingAs="h2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-64" />
                <div className="flex flex-wrap gap-2">
                  {TAG_WIDTHS.map((width) => (
                    <Skeleton
                      className={`h-7 rounded-full ${width}`}
                      key={width}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TitleCard>
          <SettingsSectionSkeleton
            description="Languages your prompts are scanned in. English is on by default."
            title="Languages"
          >
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_WIDTHS.map((width) => (
                <Skeleton className={`h-8 rounded-md ${width}`} key={width} />
              ))}
            </div>
          </SettingsSectionSkeleton>
          <SettingsSectionSkeleton
            description="Each enabled provider runs on every prompt."
            title="Models"
          >
            <div className="border-border/80 overflow-hidden rounded-lg border">
              <ul>
                {Array.from({ length: PROVIDER_ROW_COUNT }, (_, index) => (
                  <li
                    className="border-border/60 bg-background flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0"
                    key={`provider-${index + 1}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="size-5 rounded-md" />
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </div>
          </SettingsSectionSkeleton>
        </div>
      </div>
    </PageContainer>
  );
}
