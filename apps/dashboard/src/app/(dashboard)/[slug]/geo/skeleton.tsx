"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { Button } from "@/components/button";
import {
  GeoSectionSkeleton,
  GeoTableSkeleton,
} from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const ENGINE_ROW_COUNT = 4;

export function GeoPageSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">GEO</h1>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <HugeiconsIcon icon={Settings01Icon} size={16} />
              Settings
            </Button>
            <Button className="w-fit gap-2" size="sm">
              Run Scan
              <Kbd className="hidden sm:inline-flex">R</Kbd>
            </Button>
          </div>
        </header>
        <Tabs defaultValue="visibility">
          <TabsList variant="line">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
          </TabsList>
          <div className="mt-6 flex flex-col gap-6">
            <GeoSectionSkeleton
              action={
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-7 w-16 rounded-lg" />
                  <Skeleton className="h-7 w-20 rounded-lg" />
                </div>
              }
              eyebrow="Mention trend"
            >
              <Skeleton className="h-80 w-full rounded-xl" />
            </GeoSectionSkeleton>
            <GeoSectionSkeleton
              action={<Skeleton className="h-3.5 w-16" />}
              eyebrow="Mention rate by engine"
            >
              <GeoTableSkeleton rows={ENGINE_ROW_COUNT} />
            </GeoSectionSkeleton>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <GeoSectionSkeleton
                action={<Skeleton className="h-3.5 w-8" />}
                eyebrow="Share of voice"
              >
                <Skeleton className="h-64 w-full rounded-xl" />
              </GeoSectionSkeleton>
              <GeoSectionSkeleton
                action={<Skeleton className="h-3.5 w-8" />}
                eyebrow="Performance by language"
              >
                <Skeleton className="h-64 w-full rounded-xl" />
              </GeoSectionSkeleton>
            </div>
            <GeoSectionSkeleton eyebrow="Where AI usage actually happens">
              <Skeleton className="h-40 w-full rounded-xl" />
            </GeoSectionSkeleton>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}
