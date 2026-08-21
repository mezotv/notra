"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
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
    <section className="min-w-0 space-y-4">
      <div className="space-y-1">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-pretty text-muted-foreground text-sm">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function GeoSettingsSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-8 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            How your brand is identified and where prompts are scanned.
          </p>
        </header>
        <div className="space-y-10">
          <section className="min-w-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-9 w-full rounded-md" />
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
          </section>
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
            <ul className="overflow-hidden rounded-md border">
              {Array.from({ length: PROVIDER_ROW_COUNT }, (_, index) => (
                <li
                  className="flex items-center justify-between gap-3 border-border/60 border-b bg-muted px-3 py-2 last:border-b-0"
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
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </SettingsSectionSkeleton>
        </div>
      </div>
    </PageContainer>
  );
}
